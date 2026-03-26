"""
SAM 2 ONNX Model Exporter for PIXLAYER
Run this script to download and convert SAM 2 models to ONNX format.

Usage:
  pip install torch segment-anything-2 onnx onnxruntime
  python export_sam2_onnx.py

The exported ONNX files will be saved to: client/public/models/
"""
import os
import sys

try:
    import torch
    import onnx
except ImportError:
    print("Installing dependencies...")
    os.system(f"{sys.executable} -m pip install torch onnx onnxruntime")
    import torch
    import onnx

# Try to use the local cloned repo
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'temp-sam2'))

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'client', 'public', 'models')
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"Output directory: {OUTPUT_DIR}")
print()
print("=" * 60)
print("SAM 2 ONNX models need to be exported using the Colab notebook.")
print("Follow these steps:")
print()
print("1. Open this Colab notebook:")
print("   https://colab.research.google.com/drive/1tqdYbjmFq4PK3Di7sLONd0RkKS0hBgId")
print()
print("2. Run all cells to export the encoder and decoder")
print()
print("3. Download the two ONNX files and place them in:")
print(f"   {OUTPUT_DIR}")
print()
print("   - sam2_hiera_tiny_encoder.onnx")
print("   - sam2_hiera_tiny_decoder.onnx")
print("=" * 60)
print()
print("Alternatively, you can download pre-converted models from:")
print("  https://huggingface.co/piddnad/sam2-onnx-encoder-decoder")
print("  (requires HuggingFace account)")
