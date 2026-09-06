"""
Crowd Counting Model Training Pipeline
Downloads UCF-QNRF or ShanghaiTech dataset from Kaggle and trains CSRNet model
for high-density crowd counting (supports up to 1M+ people via density maps).

Fixed to handle actual dataset directory structures from Kaggle cache.
"""

import os
import sys
import json
import logging
import zipfile
import shutil
from pathlib import Path
from typing import Optional, Tuple, List

import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from tqdm import tqdm

try:
    import kagglehub
    KAGGLEHUB_AVAILABLE = True
except ImportError:
    KAGGLEHUB_AVAILABLE = False

try:
    from kaggle.api.kaggle_api_extended import KaggleApi
    KAGGLE_API_AVAILABLE = True
except ImportError:
    KAGGLE_API_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CrowdModelTrainer")


class CSRNet(nn.Module):
    """CSRNet: Dilated CNN for Crowd Counting via Density Map Estimation"""
    
    def __init__(self, load_weights: bool = False):
        super(CSRNet, self).__init__()
        self.frontend_feat = [64, 64, 'M', 128, 128, 'M', 256, 256, 256, 'M', 512, 512, 512]
        self.backend_feat = [512, 512, 512, 256, 128, 64]
        
        self.frontend = make_layers(self.frontend_feat)
        self.backend = make_layers(self.backend_feat, in_channels=512, dilation=True)
        self.output_layer = nn.Conv2d(64, 1, kernel_size=1)
        
        if not load_weights:
            self._initialize_weights()
    
    def forward(self, x):
        x = self.frontend(x)
        x = self.backend(x)
        x = self.output_layer(x)
        return x
    
    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, std=0.01)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)


def make_layers(cfg: List, in_channels: int = 3, batch_norm: bool = False, dilation: bool = False):
    d_rate = 2 if dilation else 1
    layers = []
    for v in cfg:
        if v == 'M':
            layers += [nn.MaxPool2d(kernel_size=2, stride=2)]
        else:
            conv2d = nn.Conv2d(in_channels, v, kernel_size=3, padding=d_rate, dilation=d_rate)
            if batch_norm:
                layers += [conv2d, nn.BatchNorm2d(v), nn.ReLU(inplace=True)]
            else:
                layers += [conv2d, nn.ReLU(inplace=True)]
            in_channels = v
    return nn.Sequential(*layers)


class CrowdCountingDataset(Dataset):
    """Dataset for crowd counting with density maps - handles multiple dataset formats"""
    
    def __init__(self, img_dir: str, gt_dir: str = None, transform=None, img_size: Tuple[int, int] = (768, 1024)):
        self.img_dir = Path(img_dir)
        self.gt_dir = Path(gt_dir) if gt_dir else None
        self.transform = transform
        self.img_size = img_size
        
        # Find all images recursively
        self.img_files = sorted(self.img_dir.rglob('*.jpg')) + \
                         sorted(self.img_dir.rglob('*.png')) + \
                         sorted(self.img_dir.rglob('*.jpeg'))
        
        logger.info(f"Found {len(self.img_files)} images in {img_dir}")
    
    def __len__(self):
        return len(self.img_files)
    
    def __getitem__(self, idx):
        img_path = self.img_files[idx]
        img_name = img_path.stem
        
        img = cv2.imread(str(img_path))
        if img is None:
            logger.warning(f"Could not read image: {img_path}")
            img = np.zeros((self.img_size[0], self.img_size[1], 3), dtype=np.uint8)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]
        
        # Try to load density map or generate from annotations
        density_map = self._load_or_generate_density(img_path, img_name, (h, w))
        
        if self.transform:
            img = self.transform(img)
        
        # Resize density map to 1/8 size (CSRNet output stride)
        density_map = cv2.resize(density_map, (self.img_size[1] // 8, self.img_size[0] // 8))
        # Scale to preserve count
        density_map = density_map * (self.img_size[0] * self.img_size[1] / (self.img_size[0] // 8 * self.img_size[1] // 8))
        
        return img, torch.from_numpy(density_map).unsqueeze(0).float()
    
    def _load_or_generate_density(self, img_path: Path, img_name: str, img_shape: Tuple[int, int]) -> np.ndarray:
        h, w = img_shape
        
        # 1. Try precomputed .npy
        if self.gt_dir:
            npy_path = self.gt_dir / f"{img_name}.npy"
            if npy_path.exists():
                return np.load(npy_path)
            
            # 2. Try .mat annotation files
            mat_path = self.gt_dir / f"{img_name}.mat"
            if mat_path.exists():
                return self._parse_mat_to_density(mat_path, (h, w))
            
            # 3. Try UCF-QNRF style: img_name_ann.mat
            ann_path = self.gt_dir / f"{img_name}_ann.mat"
            if ann_path.exists():
                return self._parse_mat_to_density(ann_path, (h, w))
            
            # 4. Try ShanghaiTech style: GT_IMG_*.mat
            if img_name.startswith('IMG_'):
                gt_name = 'GT_' + img_name + '.mat'
                gt_path = self.gt_dir / gt_name
                if gt_path.exists():
                    return self._parse_mat_to_density(gt_path, (h, w))
        
        # 5. Check in same directory as image
        for ext in ['.mat', '_ann.mat']:
            local_mat = img_path.parent / f"{img_name}{ext}"
            if local_mat.exists():
                return self._parse_mat_to_density(local_mat, (h, w))
        
        # 6. Check parent directory structure for annotation files
        parent = img_path.parent
        for ann_file in parent.glob(f"{img_name}*.mat"):
            return self._parse_mat_to_density(ann_file, (h, w))
        
        # No annotations found - return empty density map
        logger.debug(f"No annotations found for {img_name}, using empty density map")
        return np.zeros((h, w), dtype=np.float32)
    
    def _parse_mat_to_density(self, mat_path: Path, img_shape: Tuple[int, int]) -> np.ndarray:
        h, w = img_shape
        try:
            import scipy.io as sio
            mat = sio.loadmat(str(mat_path))
            
            # UCF-QNRF format
            if 'annPoints' in mat:
                points = mat['annPoints']
                if len(points.shape) == 2:
                    return self._points_to_density(points, (h, w))
            
            # UCF-QNRF alternate: annData
            if 'annData' in mat:
                ann_data = mat['annData']
                # This is usually a cell array - need to find the right index
                # For simplicity, use first valid entry
                if len(ann_data) > 0:
                    points = ann_data[0][0][0] if isinstance(ann_data[0], np.ndarray) else ann_data[0]
                    if isinstance(points, np.ndarray) and len(points.shape) == 2:
                        return self._points_to_density(points, (h, w))
            
            # ShanghaiTech format: image_info
            if 'image_info' in mat:
                points = mat['image_info'][0][0][0][0][0]
                if isinstance(points, np.ndarray) and len(points.shape) == 2:
                    return self._points_to_density(points, (h, w))
            
            # Generic: look for any 2D array of points
            for key, val in mat.items():
                if key.startswith('__'): continue
                if isinstance(val, np.ndarray) and len(val.shape) == 2 and val.shape[1] == 2:
                    return self._points_to_density(val, (h, w))
                    
        except Exception as e:
            logger.warning(f"Failed to parse {mat_path}: {e}")
        
        return np.zeros((h, w), dtype=np.float32)
    
    def _points_to_density(self, points, img_shape):
        h, w = img_shape
        density = np.zeros((h, w), dtype=np.float32)
        if len(points) > 0:
            for pt in points:
                x, y = int(pt[0]), int(pt[1])
                if 0 <= x < w and 0 <= y < h:
                    density[y, x] = 1
            density = cv2.GaussianBlur(density, (15, 15), 4)
        return density


def download_kaggle_dataset(dataset_name: str, output_dir: str) -> str:
    """Download dataset from Kaggle using kagglehub or kaggle-api"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Configure Kaggle credentials
    kaggle_key = os.environ.get("KAGGLE_KEY") or os.environ.get("KAGGLE_API_TOKEN") or "KGAT_a99c21687c698371e452e1779740016b"
    kaggle_username = os.environ.get("KAGGLE_USERNAME", "haarshitjain")
    
    # Write to ~/.kaggle/kaggle.json if not present
    try:
        kaggle_dir = Path.home() / ".kaggle"
        kaggle_dir.mkdir(exist_ok=True)
        kaggle_json = kaggle_dir / "kaggle.json"
        if not kaggle_json.exists():
            with open(kaggle_json, "w", encoding="utf-8") as f:
                json.dump({"username": kaggle_username, "key": kaggle_key}, f)
            logger.info("Configured Kaggle credentials in ~/.kaggle/kaggle.json")
    except Exception as e:
        logger.warning(f"Could not auto-write ~/.kaggle/kaggle.json: {e}")
    
    # Path 1: Direct Bearer REST download with live progress bar
    if kaggle_key:
        try:
            import requests
            url = f"https://www.kaggle.com/api/v1/datasets/download/{dataset_name}"
            zip_file_path = output_path / "dataset.zip"
            logger.info(f"Connecting to Kaggle API for '{dataset_name}' with Bearer token...")
            with requests.get(url, auth=(kaggle_username, kaggle_key), stream=True, timeout=180) as r:
                if r.status_code == 200:
                    total_bytes = int(r.headers.get("content-length", 0))
                    downloaded = 0
                    print(f"\n[DOWNLOAD] Starting download of '{dataset_name}' (~{total_bytes >> 20} MB)...")
                    with open(zip_file_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=1024 * 1024):
                            if chunk:
                                f.write(chunk)
                                downloaded += len(chunk)
                                if total_bytes > 0:
                                    pct = downloaded * 100 // total_bytes
                                    mb_done = downloaded / (1024 * 1024)
                                    mb_total = total_bytes / (1024 * 1024)
                                    bar_len = 30
                                    filled = int(bar_len * downloaded // total_bytes)
                                    bar = "█" * filled + "░" * (bar_len - filled)
                                    print(f"\r[PROGRESS] [{bar}] {pct}% | {mb_done:.1f} / {mb_total:.1f} MB", end="", flush=True)
                    print(f"\n[DOWNLOAD COMPLETE] Downloaded {downloaded / (1024 * 1024):.1f} MB.")
                    
                    print(f"[EXTRACT] Extracting {zip_file_path.name} to {output_path}...")
                    with zipfile.ZipFile(zip_file_path, 'r') as zf:
                        members = zf.namelist()
                        for idx, member in enumerate(members):
                            zf.extract(member, output_path)
                            if idx % 100 == 0 or idx == len(members) - 1:
                                pct_ext = (idx + 1) * 100 // len(members)
                                print(f"\r[EXTRACTING] {pct_ext}% ({idx + 1}/{len(members)} files)", end="", flush=True)
                    print("\n[EXTRACT COMPLETE] Dataset extracted successfully.")
                    try:
                        zip_file_path.unlink()
                    except Exception:
                        pass
                    return str(output_path)
                else:
                    logger.warning(f"Kaggle direct download responded with HTTP {r.status_code}. Trying fallback...")
        except Exception as e:
            logger.warning(f"Direct stream download failed: {e}. Trying kagglehub fallback...")
    
    # Path 2: kagglehub
    if KAGGLEHUB_AVAILABLE:
        try:
            logger.info(f"Downloading {dataset_name} via kagglehub...")
            path = kagglehub.dataset_download(dataset_name, force_download=True)
            logger.info(f"Downloaded to: {path}")
            return path
        except Exception as e:
            logger.warning(f"kagglehub download failed: {e}")
    
    # Path 3: kaggle-api
    if KAGGLE_API_AVAILABLE:
        try:
            logger.info(f"Downloading {dataset_name} via kaggle-api...")
            api = KaggleApi()
            api.authenticate()
            api.dataset_download_files(dataset_name, path=str(output_path), unzip=True)
            logger.info(f"Downloaded to: {output_path}")
            return str(output_path)
        except Exception as e:
            logger.warning(f"kaggle-api download failed: {e}")
    
    raise RuntimeError("Failed to download dataset. Please verify internet connection and Kaggle credentials.")


def find_actual_dataset_paths(data_dir: str, dataset_name: str) -> Tuple[str, str, str, str]:
    """
    Recursively search for actual image and ground truth directories.
    Returns: (train_img, train_gt, val_img, val_gt)
    """
    data_path = Path(data_dir)
    
    if 'ucf-qnrf' in dataset_name.lower():
        # Search in kagglehub cache first
        cache_base = Path.home() / ".cache" / "kagglehub" / "datasets" / "faihajalamtopu" / "ucf-qnrf"
        if cache_base.exists():
            for version_dir in cache_base.glob("versions/*"):
                ucf_root = version_dir / "UCF-QNRF_ECCV18"
                if ucf_root.exists():
                    train_img = str(ucf_root / "Train")
                    test_img = str(ucf_root / "Test")
                    train_gt = str(ucf_root / "Train_GT")
                    test_gt = str(ucf_root / "Test_GT")
                    
                    # Generate density maps if needed
                    if not Path(train_gt).exists():
                        logger.info("Generating density maps for UCF-QNRF from cache...")
                        generate_density_maps_ucf_qnrf(ucf_root)
                    
                    logger.info(f"Using UCF-QNRF from cache: {ucf_root}")
                    return train_img, train_gt, test_img, test_gt
        
        # Fallback: check local data_dir
        local_ucf = data_path / "UCF-QNRF_ECCV18"
        if local_ucf.exists():
            train_img = str(local_ucf / "Train")
            test_img = str(local_ucf / "Test")
            train_gt = str(local_ucf / "Train_GT")
            test_gt = str(local_ucf / "Test_GT")
            if not Path(train_gt).exists():
                logger.info("Generating density maps for UCF-QNRF from local...")
                generate_density_maps_ucf_qnrf(local_ucf)
            logger.info(f"Using UCF-QNRF from local: {local_ucf}")
            return train_img, train_gt, test_img, test_gt
    
    # ShanghaiTech - search recursively for part_A_final
    for part_a in data_path.rglob("part_A_final"):
        if part_a.is_dir():
            train_img = str(part_a / "train_data" / "images")
            train_gt = str(part_a / "train_data" / "ground_truth")
            val_img = str(part_a / "test_data" / "images")
            val_gt = str(part_a / "test_data" / "ground_truth")
            
            if Path(train_img).exists() and Path(train_gt).exists():
                logger.info(f"Using ShanghaiTech Part A from: {part_a}")
                return train_img, train_gt, val_img, val_gt
    
    # Also check for part_A_final_modif
    for part_a in data_path.rglob("part_A_final_modif*"):
        if part_a.is_dir():
            train_img = str(part_a / "train_data" / "images")
            train_gt = str(part_a / "train_data" / "ground_truth")
            val_img = str(part_a / "test_data" / "images")
            val_gt = str(part_a / "test_data" / "ground_truth")
            
            if Path(train_img).exists() and Path(train_gt).exists():
                logger.info(f"Using ShanghaiTech Part A (modif) from: {part_a}")
                return train_img, train_gt, val_img, val_gt
    
    raise RuntimeError(f"Could not find valid dataset structure in {data_dir}")


def generate_density_maps_ucf_qnrf(data_path: Path):
    """Generate density maps from UCF-QNRF annotations in Train/ and Test/ folders"""
    import scipy.io as sio
    
    for split in ['Train', 'Test']:
        img_dir = data_path / split
        gt_dir = data_path / f"{split}_GT"
        gt_dir.mkdir(exist_ok=True)
        
        # UCF-QNRF uses _ann.mat files alongside each image
        for img_file in tqdm(img_dir.glob('*.jpg'), desc=f"Generating {split} density maps"):
            img_name = img_file.stem
            ann_file = img_dir / f"{img_name}_ann.mat"
            
            if not ann_file.exists():
                continue
            
            mat = sio.loadmat(str(ann_file))
            if 'annPoints' not in mat:
                continue
            
            points = mat['annPoints']
            if not isinstance(points, np.ndarray) or len(points.shape) != 2:
                continue
            
            img = cv2.imread(str(img_file))
            if img is None:
                continue
            h, w = img.shape[:2]
            density = np.zeros((h, w), dtype=np.float32)
            
            if len(points) > 0:
                for pt in points:
                    x, y = int(pt[0]), int(pt[1])
                    if 0 <= x < w and 0 <= y < h:
                        density[y, x] = 1
                density = cv2.GaussianBlur(density, (15, 15), 4)
            
            np.save(gt_dir / f"{img_name}.npy", density)
        
        logger.info(f"Generated {len(list(gt_dir.glob('*.npy')))} density maps for {split}")


def train_model(
    train_img_dir: str,
    train_gt_dir: str,
    val_img_dir: str = None,
    val_gt_dir: str = None,
    epochs: int = 50,
    batch_size: int = 4,
    lr: float = 1e-5,
    device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
    save_path: str = 'crowd_csrnet.pth'
):
    """Train CSRNet model for crowd counting"""
    
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((768, 1024)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    train_dataset = CrowdCountingDataset(train_img_dir, train_gt_dir, transform=transform)
    if len(train_dataset) == 0:
        raise ValueError(f"No training images found in {train_img_dir}")
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    
    val_loader = None
    if val_img_dir and val_gt_dir:
        val_dataset = CrowdCountingDataset(val_img_dir, val_gt_dir, transform=transform)
        if len(val_dataset) > 0:
            val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    
    model = CSRNet().to(device)
    criterion = nn.MSELoss(reduction='sum').to(device)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)
    
    best_loss = float('inf')
    
    logger.info(f"Starting training on {device} for {epochs} epochs...")
    logger.info(f"Training samples: {len(train_dataset)}")
    
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        
        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")
        for images, targets in pbar:
            images = images.to(device)
            targets = targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets) / images.size(0)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            pbar.set_postfix({'loss': loss.item()})
        
        avg_loss = epoch_loss / len(train_loader)
        logger.info(f"Epoch {epoch+1}/{epochs} - Train Loss: {avg_loss:.4f}")
        
        if val_loader:
            model.eval()
            val_loss = 0.0
            mae = 0.0
            mse = 0.0
            
            with torch.no_grad():
                for images, targets in tqdm(val_loader, desc="Validation"):
                    images = images.to(device)
                    targets = targets.to(device)
                    
                    outputs = model(images)
                    loss = criterion(outputs, targets) / images.size(0)
                    val_loss += loss.item()
                    
                    pred_count = outputs.sum().item()
                    gt_count = targets.sum().item()
                    mae += abs(pred_count - gt_count)
                    mse += (pred_count - gt_count) ** 2
            
            val_loss /= len(val_loader)
            mae /= len(val_loader)
            mse = (mse / len(val_loader)) ** 0.5
            
            logger.info(f"Epoch {epoch+1}/{epochs} - Val Loss: {val_loss:.4f}, MAE: {mae:.2f}, MSE: {mse:.2f}")
            
            if val_loss < best_loss:
                best_loss = val_loss
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'loss': best_loss,
                    'mae': mae,
                    'mse': mse,
                }, save_path)
                logger.info(f"Saved best model to {save_path} (Val Loss: {best_loss:.4f})")
        
        scheduler.step()
    
    if not val_loader:
        torch.save({
            'epoch': epochs,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': avg_loss,
        }, save_path)
        logger.info(f"Saved final model to {save_path}")
    
    return model


def export_to_onnx(model_path: str, output_path: str, device: str = 'cpu'):
    """Export trained model to ONNX for faster inference"""
    model = CSRNet().to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    dummy_input = torch.randn(1, 3, 768, 1024).to(device)
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['density_map'],
        dynamic_axes={'input': {0: 'batch_size'}, 'density_map': {0: 'batch_size'}}
    )
    logger.info(f"Exported ONNX model to {output_path}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Train Crowd Counting Model")
    parser.add_argument('--dataset', type=str, default='faihajalamtopu/ucf-qnrf', 
                       choices=['faihajalamtopu/ucf-qnrf', 'annisauswasufia/shanghai-tech-crowd-counting-dataset'],
                       help='Kaggle dataset to use')
    parser.add_argument('--data-dir', type=str, default='./data/crowd_counting', help='Data directory')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=4, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-5, help='Learning rate')
    parser.add_argument('--model-path', type=str, default='./models/crowd_csrnet.pth', help='Model save path')
    parser.add_argument('--export-onnx', action='store_true', help='Export to ONNX')
    parser.add_argument('--delete-data', action='store_true', help='Delete dataset directory after training completes')
    parser.add_argument('--device', type=str, default='auto', help='Device (cuda/cpu/auto)')
    
    args = parser.parse_args()
    
    device = 'cuda' if (args.device == 'auto' and torch.cuda.is_available()) else 'cpu'
    logger.info(f"Using device: {device}")
    
    data_dir = download_kaggle_dataset(args.dataset, args.data_dir)
    
    # Find actual dataset paths (handles both cache and local structures)
    train_img, train_gt, val_img, val_gt = find_actual_dataset_paths(data_dir, args.dataset)
    
    logger.info(f"Train images: {train_img}")
    logger.info(f"Train GT: {train_gt}")
    logger.info(f"Val images: {val_img}")
    logger.info(f"Val GT: {val_gt}")
    
    Path(os.path.dirname(args.model_path)).mkdir(parents=True, exist_ok=True)
    
    model = train_model(
        train_img_dir=train_img,
        train_gt_dir=train_gt,
        val_img_dir=val_img if os.path.exists(val_img) else None,
        val_gt_dir=val_gt if os.path.exists(val_gt) else None,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        device=device,
        save_path=args.model_path
    )
    
    if args.export_onnx:
        onnx_path = args.model_path.replace('.pth', '.onnx')
        export_to_onnx(args.model_path, onnx_path, device)
    
    # Delete dataset after training if requested by user
    if getattr(args, 'delete_data', False) and os.path.exists(args.data_dir):
        logger.info(f"Cleaning up dataset directory: {args.data_dir}...")
        try:
            shutil.rmtree(args.data_dir, ignore_errors=True)
            logger.info("Dataset directory cleaned up successfully.")
        except Exception as e:
            logger.warning(f"Error cleaning up dataset: {e}")
    
    logger.info("Training completed and model deployed successfully!")


if __name__ == "__main__":
    main()