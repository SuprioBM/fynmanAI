#!/bin/bash
set -euo pipefail

REPO_URL="https://github.com/microsoft/markitdown.git"
DEFAULT_REPO_DIR="${MARKITDOWN_REPO_DIR:-$PWD/.markitdown-src}"
DEFAULT_VENV_DIR="${MARKITDOWN_VENV_DIR:-$PWD/.venv-markitdown}"
DEFAULT_PYTHON_BIN="${PYTHON_BIN:-python3}"

usage() {
  echo "Usage: $0 [repo_dir] [venv_dir] [python_bin]"
  echo "Defaults:"
  echo "  repo_dir: $DEFAULT_REPO_DIR"
  echo "  venv_dir: $DEFAULT_VENV_DIR"
  echo "  python_bin: $DEFAULT_PYTHON_BIN"
}

setup_markitdown() {
  local repo_dir="$1"
  local venv_dir="$2"
  local python_bin="$3"

  if ! command -v git >/dev/null 2>&1; then
    echo "git is required but not installed."
    return 1
  fi

  if ! command -v "$python_bin" >/dev/null 2>&1; then
    echo "Python executable not found: $python_bin"
    return 1
  fi

  if ! command -v uv >/dev/null 2>&1; then
    echo "uv is required but not installed. Installing..."
    if command -v curl >/dev/null 2>&1; then
      curl -LsSf https://astral.sh/uv/install.sh | sh
    elif command -v wget >/dev/null 2>&1; then
      wget -qO- https://astral.sh/uv/install.sh | sh
    else
      echo "curl or wget is required to install uv."
      return 1
    fi

    export PATH="$HOME/.local/bin:$PATH"

    if ! command -v uv >/dev/null 2>&1; then
      echo "uv installation completed but uv was not found in PATH."
      echo "Add $HOME/.local/bin to PATH and re-run the script."
      return 1
    fi
  fi

  if [ ! -d "$repo_dir/.git" ]; then
    echo "Cloning MarkItDown into $repo_dir"
    git clone "$REPO_URL" "$repo_dir"
  else
    echo "MarkItDown repo already exists at $repo_dir"
  fi

  if [ ! -d "$venv_dir" ]; then
    echo "Creating virtual environment at $venv_dir"
    uv venv "$venv_dir" --python "$python_bin"
  else
    echo "Virtual environment already exists at $venv_dir"
  fi

  pushd "$repo_dir" >/dev/null
  uv pip install -e "packages/markitdown[all]" --python "$venv_dir/bin/python"
  uv pip install -e "packages/markitdown-ocr" --python "$venv_dir/bin/python"
  uv pip install openai --python "$venv_dir/bin/python"
  popd >/dev/null

  echo "MarkItDown setup complete."
  echo "Activate with: source $venv_dir/bin/activate"
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

repo_dir="${1:-$DEFAULT_REPO_DIR}"
venv_dir="${2:-$DEFAULT_VENV_DIR}"
python_bin="${3:-$DEFAULT_PYTHON_BIN}"

setup_markitdown "$repo_dir" "$venv_dir" "$python_bin"
