#!/bin/bash

# Get current script directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "  smartstock AI - Auto Setup & Launch"
echo "========================================================"
echo

# 1. Check if Node.js is installed system-wide
if command -v node &> /dev/null; then
    echo "[OK] Node.js is installed on system path."
    NODE_EXE="node"
else
    # 2. Check if Node.js is installed locally in node-bin
    if [ -f "$DIR/node-bin/bin/node" ]; then
        echo "[OK] Found local Node.js binary."
        NODE_EXE="$DIR/node-bin/bin/node"
    else
        # 3. Download portable Node.js if not found
        echo "[!] Node.js not found. Downloading portable Node.js..."
        OS_TYPE=$(uname -s)
        
        if [ "$OS_TYPE" == "Darwin" ]; then
            # macOS
            echo "[*] Downloading Node.js for macOS..."
            curl -L -o "$DIR/node.tar.gz" https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.tar.gz
        else
            # Linux
            echo "[*] Downloading Node.js for Linux..."
            curl -L -o "$DIR/node.tar.gz" https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
        fi
        
        if [ $? -ne 0 ]; then
            echo "[Error] Failed to download Node.js automatically."
            echo "Please install Node.js manually from https://nodejs.org/"
            exit 1
        fi
        
        echo "[*] Extracting Node.js package..."
        mkdir -p "$DIR/node-temp"
        tar -xf "$DIR/node.tar.gz" -C "$DIR/node-temp" --strip-components=1
        mkdir -p "$DIR/node-bin"
        mv "$DIR/node-temp"/* "$DIR/node-bin/"
        rm "$DIR/node.tar.gz"
        rm -rf "$DIR/node-temp"
        
        if [ ! -f "$DIR/node-bin/bin/node" ]; then
            echo "[Error] Extraction failed or binary is missing."
            exit 1
        fi
        
        echo "[OK] Local Node.js setup complete!"
        NODE_EXE="$DIR/node-bin/bin/node"
    fi
fi

echo
echo "========================================================"
echo "  1/3 Processing Raw Datasets..."
echo "========================================================"
$NODE_EXE "$DIR/data_processor.js"
if [ $? -ne 0 ]; then
    echo "[Error] Data processing failed."
    exit 1
fi

echo
echo "========================================================"
echo "  2/3 Training Machine Learning Models..."
echo "========================================================"
$NODE_EXE "$DIR/trainer.js"
if [ $? -ne 0 ]; then
    echo "[Error] Model training failed."
    exit 1
fi

echo
echo "========================================================"
echo "  3/3 Starting Web Server..."
echo "========================================================"
echo
echo "[Info] Launching dashboard at http://localhost:3000"
echo "[Info] Press Ctrl+C in this window to stop the server."
echo

# Open browser automatically
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

$NODE_EXE "$DIR/server.js"
