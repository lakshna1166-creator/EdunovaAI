#!/usr/bin/env python3
"""
Download the SentenceTransformer model into a local 'models/' directory.

This script is intended to be run DURING the Render build step (not at
runtime). Render's build container has more memory and a persistent disk,
so downloading the ~90 MB model there is safe.

The baked-in model is then loaded at runtime from the local path using
local_files_only=True, eliminating the remote download that was causing
the 512 MiB OOM.

Usage (Render Build Command):
    pip install -r requirements.txt && python scripts/download_model.py

Usage (local development):
    python scripts/download_model.py

The model will be stored in:
    EdunovaAI/AI-Rag/ai-service/models/sentence-transformers/all-MiniLM-L6-v2/

After downloading, add the model directory to .gitignore and commit it
so it is baked into the Docker image on Render.
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

# Ensure the project root is on the path for imports
_PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
LOCAL_MODELS_DIR = _PROJECT_ROOT / "models"
TARGET_CACHE_DIR = LOCAL_MODELS_DIR / MODEL_NAME.replace("/", "--")


def _eprint(msg: str) -> None:
    """Print to stderr so stdout is clean for piping."""
    print(msg, file=sys.stderr)


def _get_hf_home() -> Path:
    """Return the HuggingFace cache directory inside models/."""
    return LOCAL_MODELS_DIR / "huggingface"


def download_model() -> Path:
    """Download the SentenceTransformer model into the local models/ directory.

    Returns:
        Path to the downloaded model directory.

    Raises:
        RuntimeError: If the download fails.
    """
    import huggingface_hub

    hf_home = _get_hf_home()
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = str(hf_home)

    snapshot_path = hf_home / "snapshots"

    # Check if already fully cached (all required files present)
    if snapshot_path.exists():
        for candidate in snapshot_path.iterdir():
            if candidate.is_dir():
                # Check for at least one of the essential files
                required_files = ["config.json", "pytorch_model.bin" if not list(candidate.glob("*.safetensors")) else "model.safetensors"]
                if any((candidate / f).exists() or list(candidate.glob("model*.bin")) or list(candidate.glob("*.safetensors")) for f in ["config.json"]):
                    _eprint(
                        f"[download_model] Model already cached at {candidate}. "
                        "No re-download needed."
                    )
                    return candidate

    _eprint(f"[download_model] Downloading '{MODEL_NAME}' into {hf_home}...")
    _eprint("[download_model] This runs during build (not runtime) so it does NOT cause OOM.")

    try:
        # Download the full model (all files: config, weights, tokenizer)
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
    config_file = downloaded / "config.json"
    if not config_file.exists():
        raise RuntimeError(
            f"Downloaded model at '{downloaded}' is missing 'config.json'. "
            "The model may be corrupted."
        )

    has_weights = (
        list(downloaded.glob("*.safetensors"))
        or list(downloaded.glob("pytorch_model*.bin"))
        or list(downloaded.glob("model*.bin"))
    )
    if not has_weights:
        raise RuntimeError(
            f"Downloaded model at '{downloaded}' has no weight files "
            "(*.safetensors or pytorch_model*.bin). The model may be corrupted."
        )

    _eprint(f"[download_model] Verified: config.json and weight files present.")
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
        _eprint("[download_model] Next: ensure 'models/' is in .gitignore and the model is committed.")
    except Exception as exc:
        _eprint(f"[download_model] ERROR: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
