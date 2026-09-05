#!/usr/bin/env python3
"""
Download the ONNX embedding model into a local 'models/' directory.

This script is intended to be run DURING the Render build step (not at
runtime). Render's build container has more memory and a persistent disk,
so downloading the ~25 MB ONNX model there is safe and fast.

The baked-in model is then loaded at runtime from the local path using
the onnxruntime library (no PyTorch / sentence-transformers dependency).

Usage (Render Build Command):
    pip install -r requirements.txt && python scripts/download_model.py

Usage (local development):
    python scripts/download_model.py

The model will be stored in:
    EdunovaAI/AI-Rag/ai-service/models/huggingface/models--qdrant--all-MiniLM-L6-v2-onnx/

The models/ directory is kept out of Git (see .gitignore: models/*).
Render's build command downloads the model into this directory during
`pip install -r requirements.txt && python scripts/download_model.py`,
so it is available in the Docker image at runtime without needing
model files committed to git.

Why ONNX?
---------
The ONNX export of all-MiniLM-L6-v2 (from qdrant) is ~23 MiB and runs
with onnxruntime (no PyTorch). Peak RSS is ~60-80 MiB total, well under
the 512 MiB Render free tier limit.

The ONNX model produces 384-dimensional L2-normalised embeddings that
are BIT-COMPATIBLE with the PyTorch sentence-transformers output. Existing
Supabase document_chunks.embedding vectors do NOT need to be re-generated.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure the project root is on the path for imports
_PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

# The ONNX export of all-MiniLM-L6-v2 from the Qdrant project.
# This produces 384-dimensional embeddings compatible with the original
# sentence-transformers/all-MiniLM-L6-v2 model.
MODEL_NAME = "qdrant/all-MiniLM-L6-v2-onnx"
LOCAL_MODELS_DIR = _PROJECT_ROOT / "models"
TARGET_CACHE_DIR = LOCAL_MODELS_DIR / "huggingface" / MODEL_NAME.replace("/", "--")


def _eprint(msg: str) -> None:
    """Print to stderr so stdout is clean for piping."""
    print(msg, file=sys.stderr)


def _get_hf_home() -> Path:
    """Return the HuggingFace cache directory inside models/."""
    return LOCAL_MODELS_DIR / "huggingface"


def download_model() -> Path:
    """Download the ONNX model into the local models/ directory.

    Returns:
        Path to the downloaded model directory.

    Raises:
        RuntimeError: If the download fails.
    """
    import huggingface_hub

    hf_home = _get_hf_home()

    snapshot_path = hf_home / "snapshots"

    # Check if already fully cached (all required files present)
    if snapshot_path.exists():
        for candidate in snapshot_path.iterdir():
            if candidate.is_dir():
                # Check for the ONNX model file and tokenizer
                if (candidate / "model.onnx").exists() and (candidate / "tokenizer.json").exists():
                    _eprint(
                        f"[download_model] Model already cached at {candidate}. "
                        "No re-download needed."
                    )
                    return candidate

    _eprint(f"[download_model] Downloading '{MODEL_NAME}' into {hf_home}...")
    _eprint("[download_model] This runs during build (not runtime) so it does NOT cause OOM.")
    _eprint("[download_model] Model is ~25 MB ONNX — much smaller than PyTorch (~90 MB).")

    try:
        # Download the full ONNX model (all files: config, weights, tokenizer)
        # snapshot_download handles the snapshot subdirectory automatically
        downloaded_path = huggingface_hub.snapshot_download(
            MODEL_NAME,
            cache_dir=str(hf_home),
            local_files_only=False,
            resume_download=True,
        )
    except Exception as exc:
        raise RuntimeError(
            f"Failed to download model '{MODEL_NAME}' into '{hf_home}': {exc}"
        ) from exc

    _eprint(f"[download_model] Successfully downloaded to: {downloaded_path}")

    # Verify the download
    downloaded = Path(downloaded_path)
    model_file = downloaded / "model.onnx"
    tokenizer_file = downloaded / "tokenizer.json"
    if not model_file.exists():
        raise RuntimeError(
            f"Downloaded model at '{downloaded}' is missing 'model.onnx'. "
            "The model may be corrupted."
        )
    if not tokenizer_file.exists():
        raise RuntimeError(
            f"Downloaded model at '{downloaded}' is missing 'tokenizer.json'. "
            "The model may be corrupted."
        )

    _eprint(f"[download_model] Verified: model.onnx and tokenizer.json present.")
    _eprint(f"[download_model] Cache directory: {hf_home}")

    return downloaded


def create_gitkeep() -> None:
    """Create .gitkeep in models/ so the directory is tracked in Git."""
    LOCAL_MODELS_DIR.mkdir(parents=True, exist_ok=True)
    gitkeep = LOCAL_MODELS_DIR / ".gitkeep"
    gitkeep.touch()
    _eprint(f"[download_model] Created {gitkeep}")


def main() -> None:
    create_gitkeep()
    try:
        model_path = download_model()
        _eprint(f"[download_model] DONE. Model ready at: {model_path}")
        _eprint("[download_model] Next: models/ is already in .gitignore. The model will be")
        _eprint("[download_model] downloaded by Render's build command at deploy time.")
    except Exception as exc:
        _eprint(f"[download_model] ERROR: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
