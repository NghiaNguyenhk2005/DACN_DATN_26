#!/usr/bin/env bash
# Một lệnh: cài phụ thuộc, bật api+shop+admin, chờ sẵn sàng, chạy e2e rồi tắt server.
# --serve: chỉ mở prototype cho tự thao tác (không chạy e2e), Ctrl+C để tắt.
set -u
SERVE=0; [ "${1:-}" = "--serve" ] && SERVE=1
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
export PLAYWRIGHT_HTML_OPEN=never
NAMES=(API Shop Admin)
URLS=("http://localhost:4000/api/health" "http://localhost:3000" "http://localhost:5173")
up() { curl -s -o /dev/null --max-time 3 "$1"; }

if [ ! -d node_modules ] || [ ! -d apps/e2e/node_modules ]; then
  echo ">> Cài phụ thuộc (pnpm install)"; pnpm install --frozen-lockfile || exit $?
fi
[ $SERVE -eq 0 ] && { echo ">> Đảm bảo có trình duyệt Chromium"; pnpm --filter @farmery/e2e exec playwright install chromium; }

PID=""; ALL=1
for u in "${URLS[@]}"; do up "$u" || ALL=0; done
cleanup() { [ -n "$PID" ] && { echo ">> Tắt server"; kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null; }; }
trap cleanup EXIT; trap 'exit 130' INT TERM
if [ $ALL -eq 1 ]; then echo ">> Server đã chạy sẵn, dùng lại (không tắt khi xong)"
else
  echo ">> Bật server (log: scripts/.demo-dev.log)"
  set -m; pnpm dev > "$ROOT/scripts/.demo-dev.log" 2>&1 & PID=$!; set +m
  END=$((SECONDS+240))
  for i in 0 1 2; do
    printf "   chờ %s " "${NAMES[$i]}"
    until up "${URLS[$i]}"; do
      [ $SECONDS -gt $END ] && { echo; echo "Hết giờ chờ ${NAMES[$i]} — xem scripts/.demo-dev.log"; exit 1; }
      sleep 2; printf "."
    done; echo " sẵn sàng"
  done
fi
if [ $SERVE -eq 1 ]; then
  printf "\n== Prototype đang chạy ==\n  Shop:  http://localhost:3000\n  Admin: http://localhost:5173\n  API:   http://localhost:4000/docs\nNhấn Ctrl+C để tắt.\n"
  while true; do sleep 5; done
fi
pnpm e2e; CODE=$?
[ $CODE -eq 0 ] && R="ĐẠT" || R="CÓ CA HỎNG (mã $CODE)"
echo; echo "== Tóm tắt: e2e $R — báo cáo: apps/e2e/playwright-report/index.html =="
exit $CODE
