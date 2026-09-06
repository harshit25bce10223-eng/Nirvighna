import sys
sys.path.insert(0, r'C:\SVH\Kavach\backend')
import os
os.chdir(r'C:\SVH\Kavach\backend')

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(r'C:\SVH\Kavach\backend\training_log.txt', mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

from train_crowd_model import main
import sys
sys.argv = [
    'train_crowd_model.py',
    '--dataset', 'faihajalamtopu/ucf-qnrf',
    '--data-dir', r'C:\SVH\Kavach\backend\data\crowd_counting',
    '--epochs', '50',
    '--batch-size', '4',
    '--model-path', r'C:\SVH\Kavach\backend\models\crowd_csrnet.pth',
    '--export-onnx',
    '--device', 'auto'
]
main()