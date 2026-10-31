# Kolors Virtual Try-On Setup Guide

This guide explains how to set up the Kolors Virtual Try-On library for use with FashionMentor.

## Overview

The virtual try-on feature has been integrated into the application. The frontend components are ready, but you need to set up the Python backend service that uses the Kolors library.

## Frontend Integration

The following components have been created/updated:

- **VirtualTryOn Component** (`client/src/components/fashion/VirtualTryOn.tsx`): A modal dialog for uploading user photos and viewing try-on results
- **OutfitGrid Component**: Updated to include "Try it on" buttons
- **Recommendations Page**: Updated with virtual try-on functionality

## Backend Setup

### Option 1: Python HTTP Service (Recommended)

1. **Set up Python environment:**
   ```bash
   # Create a virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install basic dependencies (demo mode - no PyTorch needed)
   cd python
   pip install -r requirements-simple.txt
   
   # For full Kolors integration, install PyTorch separately:
   # See python/INSTALL_PYTORCH.md for detailed instructions
   # Quick CPU-only install: pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```

2. **Clone and set up Kolors (for full integration):**
   ```bash
   git clone https://github.com/Kwai-Kolors/Kolors
   cd Kolors
   
   # Option A: Using Python venv (works without conda)
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Option B: Using conda (if you have conda installed)
   # conda create --name kolors python=3.8
   # conda activate kolors
   
   # IMPORTANT: Install PyTorch FIRST (see python/INSTALL_PYTORCH.md)
   # This avoids conflicts with triton, torch, torchvision, xformers
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu  # CPU-only
   # OR for GPU: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
   
   # Then install other requirements (skip torch/torchvision/xformers/triton if already installed)
   pip install fire pydantic accelerate huggingface-hub imageio numpy omegaconf pandas Pillow tokenizers transformers safetensors diffusers sentencepiece gradio opencv-python einops timm onnxruntime
   
   # Optional: Install xformers and triton for GPU acceleration
   # pip install xformers triton
   
   python3 setup.py install
   
   # Download model weights
   huggingface-cli download --resume-download Kwai-Kolors/Kolors --local-dir weights/Kolors
   ```

3. **Create Python service:**
   - Use the example file at `python/virtual_try_on_service.py.example` as a starting point
   - Update it to use the actual Kolors library
   - Run the service: `python virtual_try_on_service.py`

4. **Update Node.js service:**
   - Open `server/services/virtualTryOn.ts`
   - Uncomment the HTTP API option (Option 1)
   - Set `PYTHON_SERVICE_URL` environment variable to your Python service URL (default: `http://localhost:8000`)

### Option 2: Python Subprocess

1. **Set up Kolors** (same as Option 1, steps 1-2)

2. **Create Python script:**
   - Create a Python script that accepts command-line arguments for input/output paths
   - The script should use Kolors to process the images

3. **Update Node.js service:**
   - Open `server/services/virtualTryOn.ts`
   - Uncomment the subprocess option (Option 2)
   - Update the Python script path to point to your script

## Environment Variables

Add to your `.env` file:
```
PYTHON_SERVICE_URL=http://localhost:8000
```

## Testing

1. Start your Python service (if using Option 1)
2. Start the Node.js server: `npm run dev`
3. Use chat outfit cards and open **Try it on** (demo mode is labeled in the dialog)
4. Click "Try it on" or "Virtual Try-On" button
5. Upload a photo and click "Try It On"

## Current Status

The frontend is fully implemented and ready to use. The backend endpoint exists but currently returns an error message indicating that the Python service needs to be set up. Once you configure the Kolors library and update `server/services/virtualTryOn.ts`, the feature will be fully functional.

## Troubleshooting

- **"Virtual try-on service is not yet configured"**: You need to set up the Python service and set the `PYTHON_SERVICE_URL` environment variable
- **"__conda_exe:1: no such file or directory"**: You don't have conda installed. Use Python venv instead (see Option A in step 2 above)
- **"Issues installing triton, torch, torchvision, xformers"**: 
  - Install PyTorch separately FIRST: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`
  - Then install other requirements (skip the PyTorch packages)
  - See `python/INSTALL_PYTORCH.md` for detailed instructions
  - For demo mode, you don't need PyTorch - just use `requirements-simple.txt`
- **CORS errors**: Make sure your Python service has CORS enabled (see the example Flask service)
- **Image processing errors**: Ensure images are in the correct format (PNG/JPEG) and not too large
- **Connection errors**: Make sure the Python service is running and accessible at the URL specified in `PYTHON_SERVICE_URL`

## Resources

- [Kolors GitHub Repository](https://github.com/Kwai-Kolors/Kolors)
- [Kolors Hugging Face Model](https://huggingface.co/Kwai-Kolors/Kolors)
