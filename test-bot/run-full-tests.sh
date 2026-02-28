#!/bin/bash

# Script para executar suite completa de testes (Linux/Mac)
# Funciona em: bash, zsh, sh

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$script_dir/run-full-tests.js"
