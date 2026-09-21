#!/bin/bash
# Setup script for shared git hooks
# Run this script to configure git hooks for all users

echo "Setting up shared git hooks..."

# Configure git to use shared hooks directory
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/*

echo "Git hooks configured successfully!"
echo "The pre-commit hook will now run for all users committing to this repository."
