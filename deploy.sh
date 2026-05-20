#!/bin/bash
set -e

echo "========================================================"
echo "     AI Image Editor — Full Server Setup"
echo "========================================================"

COMFY_DIR=/opt/ComfyUI
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---------- Определяем IP сервера ----------
SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null \
         || curl -s --max-time 5 api.ipify.org 2>/dev/null \
         || hostname -I | awk '{print $1}')
echo "[*] Публичный IP: $SERVER_IP"

# ========== 1. DOCKER ==========
if ! command -v docker &>/dev/null; then
    echo "[*] Устанавливаем Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    newgrp docker
    echo "[✓] Docker установлен."
else
    echo "[✓] Docker $(docker --version | awk '{print $3}' | tr -d ',')"
fi

if ! docker compose version &>/dev/null; then
    echo "[!] Docker Compose V2 не найден. Обновите Docker (>= 23)."
    exit 1
fi

# ========== 2. НАСТРОЙКА .env ==========
cd "$SCRIPT_DIR"

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    # Автоматически заполняем IP и генерируем SECRET_KEY
    SECRET=$(openssl rand -hex 32)
    sed -i "s|REPLACE_WITH_RANDOM_SECRET_KEY_HERE|$SECRET|g" backend/.env
    sed -i "s|YOUR_SERVER_IP|$SERVER_IP|g" backend/.env
    echo "[✓] backend/.env создан (IP=$SERVER_IP, SECRET_KEY сгенерирован)"
fi

# ========== 3. DOCKER COMPOSE ==========
echo "[*] Запускаем docker-compose (сборка образов)..."
docker compose up --build -d
echo "[✓] Контейнеры запущены"

# ========== 4. COMFYUI: FIX LISTEN ADDRESS ==========
if [ -f /etc/systemd/system/comfyui.service ]; then
    if grep -q "\-\-listen 127.0.0.1" /etc/systemd/system/comfyui.service; then
        echo "[*] Исправляем ComfyUI: меняем --listen 127.0.0.1 → 0.0.0.0"
        sed -i 's/--listen 127\.0\.0\.1/--listen 0.0.0.0/' /etc/systemd/system/comfyui.service
        systemctl daemon-reload
        systemctl restart comfyui
        echo "[✓] ComfyUI перезапущен на 0.0.0.0"
    else
        echo "[✓] ComfyUI уже слушает на правильном адресе"
    fi
else
    echo "[!] ComfyUI systemd-сервис не найден — пропускаем"
fi

# ========== 5. COMFYUI-GGUF CUSTOM NODE ==========
if [ -d "$COMFY_DIR" ]; then
    if [ ! -d "$COMFY_DIR/custom_nodes/ComfyUI-GGUF" ]; then
        echo "[*] Устанавливаем ComfyUI-GGUF..."
        cd "$COMFY_DIR/custom_nodes"
        git clone --quiet https://github.com/city96/ComfyUI-GGUF.git
        "$COMFY_DIR/venv/bin/pip" install -r ComfyUI-GGUF/requirements.txt -q
        systemctl restart comfyui 2>/dev/null || true
        echo "[✓] ComfyUI-GGUF установлен"
    else
        echo "[✓] ComfyUI-GGUF уже установлен"
    fi
    cd "$SCRIPT_DIR"
else
    echo "[!] ComfyUI не найден в $COMFY_DIR — пропускаем установку нод"
fi

# ========== 6. СКАЧИВАНИЕ МОДЕЛЕЙ ==========
if [ -d "$COMFY_DIR/models" ]; then
    echo ""
    echo "[*] Скачиваем модели (~30 ГБ, займёт время)..."

    # Функция: скачивает если файл отсутствует или битый (< 1 МБ)
    download_model() {
        local url="$1"
        local dest="$2"
        local name
        name=$(basename "$dest")
        if [ -f "$dest" ] && [ "$(stat -c%s "$dest")" -gt 1048576 ]; then
            echo "  [✓] $name — уже скачан, пропускаем"
            return
        fi
        echo "  [↓] $name ..."
        mkdir -p "$(dirname "$dest")"
        wget -q --show-progress -c -O "$dest" "$url" || {
            echo "  [!] Ошибка загрузки $name — проверь URL или скачай вручную"
            rm -f "$dest"
        }
    }

    # --- CLIP / Text Encoders (публичные, без токена) ---
    download_model \
        "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" \
        "$COMFY_DIR/models/clip/clip_l.safetensors"

    download_model \
        "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors" \
        "$COMFY_DIR/models/clip/t5xxl_fp8_e4m3fn.safetensors"

    download_model \
        "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn_scaled.safetensors" \
        "$COMFY_DIR/models/text_encoders/t5xxl_fp8_e4m3fn_scaled.safetensors"

    # --- VAE (из публичного FLUX.1-schnell) ---
    download_model \
        "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors" \
        "$COMFY_DIR/models/vae/ae.safetensors"

    # --- Flux Kontext fp8 (для перекраски авто) ---
    download_model \
        "https://huggingface.co/Kijai/flux-fp8/resolve/main/flux1-dev-kontext_fp8_scaled.safetensors" \
        "$COMFY_DIR/models/diffusion_models/flux1-dev-kontext_fp8_scaled.safetensors"

    # --- Flux GGUF Q4 (для улучшения фото) ---
    download_model \
        "https://huggingface.co/city96/FLUX.1-dev-gguf/resolve/main/flux1-dev-Q4_1.gguf" \
        "$COMFY_DIR/models/unet/flux1-dev-Q4_1.gguf"

    echo "[✓] Все модели загружены"

    # Перезапускаем ComfyUI чтобы подхватил новые модели
    if systemctl is-active --quiet comfyui 2>/dev/null; then
        systemctl restart comfyui
        echo "[✓] ComfyUI перезапущен для применения моделей"
    fi
else
    echo "[!] Папка $COMFY_DIR/models не найдена — пропускаем скачку моделей"
fi

# ========== ИТОГ ==========
echo ""
echo "========================================================"
echo "  [✓] Готово!"
echo ""
echo "  Frontend:      http://$SERVER_IP:3000"
echo "  Backend API:   http://$SERVER_IP:8000"
echo "  MinIO console: http://$SERVER_IP:9001  (minioadmin/minioadmin)"
echo ""
echo "  Логи: docker compose logs -f"
echo "========================================================"
