#!/bin/bash
set -e

echo "=== AI Image Editor — Server Setup ==="

# 1. Проверяем Docker
if ! command -v docker &>/dev/null; then
    echo "[!] Docker не найден. Устанавливаем..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "[!] Docker установлен. Перелогинься и запусти скрипт снова."
    exit 0
fi

# 2. Проверяем Docker Compose
if ! docker compose version &>/dev/null; then
    echo "[!] Docker Compose V2 не найден. Обновите Docker (>= 23)."
    exit 1
fi

# 3. Создаём .env если нет
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo ""
    echo "========================================================"
    echo "  backend/.env создан из примера."
    echo "  Обязательно отредактируй его перед запуском:"
    echo ""
    echo "  1. SECRET_KEY  — замени на случайную строку"
    echo "     (openssl rand -hex 32)"
    echo ""
    echo "  2. STORAGE_PUBLIC_URL — замени YOUR_SERVER_IP"
    echo "     на публичный IP этого сервера"
    echo ""
    echo "  3. ALLOWED_ORIGINS — замени YOUR_SERVER_IP"
    echo "     на публичный IP этого сервера"
    echo ""
    echo "  Потом запусти: ./deploy.sh"
    echo "========================================================"
    exit 0
fi

# 4. Проверяем что .env настроен
if grep -q "YOUR_SERVER_IP\|REPLACE_WITH_RANDOM" backend/.env; then
    echo "[!] backend/.env содержит placeholder-значения!"
    echo "    Отредактируй backend/.env перед запуском."
    exit 1
fi

# 5. Запускаем
echo "[*] Запускаем docker-compose..."
docker compose up --build -d

echo ""
echo "=== Готово! ==="
echo "  Frontend:      http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend API:   http://$(hostname -I | awk '{print $1}'):8000"
echo "  MinIO console: http://$(hostname -I | awk '{print $1}'):9001  (minioadmin/minioadmin)"
echo ""
echo "Логи: docker compose logs -f"
