#!/bin/sh
# Chạy trước mỗi lần commit có đổi app: đổi số phiên bản để máy Na tự tải bản mới.
cd "$(dirname "$0")/.." && v=$(date +%Y%m%d%H%M%S) && sed -i "s/const APP_V='[0-9]*'/const APP_V='$v'/" app.js && printf '{"v":"%s"}\n' "$v" > version.json && echo "$v"
