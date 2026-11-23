"""Cấu hình dịch vụ AI, đọc từ biến môi trường lúc khởi động; danh sách biến ở apps/ai/.env.example."""
import os
from dataclasses import dataclass

MAX_BATCH_LIMIT = 64
MAX_TEXT_CHARS = 8000


@dataclass(frozen=True)
class Settings:
    token: str
    model_name: str
    model_cache: str | None
    max_batch: int
    max_tokens: int
    # "real" nạp BGE-M3 thật; "fake" dùng vector băm tất định, chỉ để thử nhanh và chạy trong CI.
    embedder: str


def load_settings(env: dict[str, str] | None = None) -> Settings:
    env = dict(os.environ) if env is None else env
    token = env.get("AI_SERVICE_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Thiếu AI_SERVICE_TOKEN: dịch vụ AI chỉ nhận lời gọi kèm token nội bộ")
    embedder = env.get("AI_EMBEDDER", "real").strip() or "real"
    if embedder not in ("real", "fake"):
        raise RuntimeError("AI_EMBEDDER phải là real hoặc fake")
    max_batch = _int(env, "AI_MAX_BATCH", MAX_BATCH_LIMIT, 1, MAX_BATCH_LIMIT)
    max_tokens = _int(env, "AI_MAX_TOKENS", 512, 8, 8192)
    return Settings(
        token=token,
        model_name=env.get("AI_MODEL_NAME", "BAAI/bge-m3").strip() or "BAAI/bge-m3",
        model_cache=env.get("AI_MODEL_CACHE", "").strip() or None,
        max_batch=max_batch,
        max_tokens=max_tokens,
        embedder=embedder,
    )


def _int(env: dict[str, str], name: str, default: int, lo: int, hi: int) -> int:
    raw = env.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError as e:
        raise RuntimeError(f"{name} phải là số nguyên trong khoảng {lo}..{hi}") from e
    if not lo <= value <= hi:
        raise RuntimeError(f"{name} phải là số nguyên trong khoảng {lo}..{hi}")
    return value
