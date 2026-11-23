"""Bộ nhúng văn bản: bản thật dùng BGE-M3 qua sentence-transformers, bản giả cho test và CI."""
import hashlib
import re
import threading
import unicodedata
from typing import Protocol

import numpy as np

DIM = 1024


class Embedder(Protocol):
    name: str
    dim: int

    def embed(self, texts: list[str]) -> np.ndarray:
        """Trả ma trận (len(texts), dim) float32, mỗi hàng đã chuẩn hóa L2."""
        ...


def l2_normalize(m: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(m, axis=1, keepdims=True)
    return (m / np.where(norms == 0, 1.0, norms)).astype(np.float32)


class SentenceTransformerEmbedder:
    """BGE-M3 dense 1024 chiều. Nạp mô hình lúc tạo đối tượng (lần đầu sẽ tải về, khoảng 2,2 GB)."""

    def __init__(self, model_name: str, cache_dir: str | None, max_tokens: int):
        from sentence_transformers import SentenceTransformer  # nạp muộn: import này kéo theo torch

        self._model = SentenceTransformer(model_name, cache_folder=cache_dir)
        self._model.max_seq_length = max_tokens
        self._lock = threading.Lock()  # một lần suy luận mỗi lúc, tránh tranh CPU và bộ nhớ
        self.name = model_name
        self.dim = int(self._model.get_sentence_embedding_dimension())

    def embed(self, texts: list[str]) -> np.ndarray:
        with self._lock:
            vectors = self._model.encode(texts, batch_size=16, normalize_embeddings=True, convert_to_numpy=True)
        return l2_normalize(np.asarray(vectors, dtype=np.float32))


class HashingEmbedder:
    """Vector tất định từ băm các từ đã bỏ dấu: hai câu chung từ thì gần nhau. Không phải mô hình ngôn ngữ."""

    name = "hashing-test"
    dim = DIM

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), DIM), dtype=np.float32)
        for row, text in enumerate(texts):
            for token in _tokens(text):
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                out[row, int.from_bytes(digest[:4], "big") % DIM] += 1.0 if digest[4] & 1 else -1.0
        return l2_normalize(out)


def _tokens(text: str) -> list[str]:
    folded = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    folded = "".join(c for c in folded if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", folded)
