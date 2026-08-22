import os
from PIL import Image, ImageDraw

def generate_icons():
    source_path = os.path.abspath('app icon.png')
    res_dir = os.path.abspath('android/app/src/main/res')
    public_dir = os.path.abspath('public')

    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found!")
        return

    src_img = Image.open(source_path).convert('RGBA')

    # Target densities
    densities = {
        'mipmap-mdpi': {'launcher': 48, 'foreground': 108},
        'mipmap-hdpi': {'launcher': 72, 'foreground': 162},
        'mipmap-xhdpi': {'launcher': 96, 'foreground': 216},
        'mipmap-xxhdpi': {'launcher': 144, 'foreground': 324},
        'mipmap-xxxhdpi': {'launcher': 192, 'foreground': 432}
    }

    # Helper: Create circular masked version
    def make_round(img):
        w, h = img.size
        mask = Image.new('L', (w, h), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, w, h), fill=255)
        result = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        result.paste(img, (0, 0), mask=mask)
        return result

    # Helper: Create adaptive foreground (centered within 72dp inner boundary)
    def make_foreground(src, target_size):
        # Foreground canvas is target_size x target_size
        canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
        # Inner content is ~72% of target size (safe zone)
        inner_size = int(target_size * 0.72)
        resized_src = src.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (target_size - inner_size) // 2
        canvas.paste(resized_src, (offset, offset), mask=resized_src)
        return canvas

    # Generate each density
    for folder, sizes in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)

        l_size = sizes['launcher']
        fg_size = sizes['foreground']

        # 1. Standard ic_launcher.png
        launcher_img = src_img.resize((l_size, l_size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')

        # 2. Round ic_launcher_round.png
        round_img = make_round(launcher_img)
        round_img.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')

        # 3. Adaptive ic_launcher_foreground.png
        fg_img = make_foreground(src_img, fg_size)
        fg_img.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')

        print(f"Generated {folder}: launcher {l_size}x{l_size}, fg {fg_size}x{fg_size}")

    # Also update public web assets for consistency
    src_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'official_logo.png'), 'PNG')
    src_img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'logo.png'), 'PNG')
    src_img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'favicon.png'), 'PNG')
    src_img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'favicon.ico'), 'ICO')

    print("All app icons successfully replaced and generated from 'app icon.png'!")

if __name__ == '__main__':
    generate_icons()
