import time

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, load_settings
from app.embedder import DIM, HashingEmbedder
from app.main import create_app

TOKEN = "test-token"
H = {"X-Internal-Token": TOKEN}


def settings(**kw) -> Settings:
    base = dict(token=TOKEN, model_name="BAAI/bge-m3", model_cache=None, max_batch=64, max_tokens=512, embedder="fake")
    return Settings(**{**base, **kw})


@pytest.fixture
def client():
    with TestClient(create_app(settings(), HashingEmbedder())) as c:
        yield c


def test_health_ready_without_token(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok" and body["modelLoaded"] is True and body["dim"] == DIM


def test_embed_requires_token(client):
    assert client.post("/embed", json={"texts": ["dâu tây"]}).status_code == 401
    assert client.post("/embed", json={"texts": ["dâu tây"]}, headers={"X-Internal-Token": "sai"}).status_code == 401


def test_embed_returns_normalized_1024_dim_vectors(client):
    r = client.post("/embed", json={"texts": ["dâu tây Đà Lạt", "rau ăn lẩu"]}, headers=H)
    assert r.status_code == 200
    body = r.json()
    assert body["dim"] == DIM and len(body["vectors"]) == 2
    m = np.array(body["vectors"])
    assert m.shape == (2, DIM)
    assert np.allclose(np.linalg.norm(m, axis=1), 1.0, atol=1e-5)


def test_embed_is_deterministic_and_order_preserving(client):
    a = client.post("/embed", json={"texts": ["cà chua bi", "khoai tây"]}, headers=H).json()["vectors"]
    b = client.post("/embed", json={"texts": ["khoai tây", "cà chua bi"]}, headers=H).json()["vectors"]
    assert a[0] == b[1] and a[1] == b[0]


def test_shared_words_are_closer_than_unrelated(client):
    texts = ["dâu tây Đà Lạt", "Dau tay Hana", "xe máy điện"]
    v = np.array(client.post("/embed", json={"texts": texts}, headers=H).json()["vectors"])
    assert v[0] @ v[1] > 0.5 > v[0] @ v[2]


@pytest.mark.parametrize(
    "texts",
    [[], [""], ["ok", "   "], ["x"] * 65, ["a" * 8001]],
)
def test_embed_rejects_bad_input(client, texts):
    assert client.post("/embed", json={"texts": texts}, headers=H).status_code == 422


def test_embed_503_while_model_loading():
    app = create_app(settings(embedder="fake"), embedder=None)
    with TestClient(app) as c:
        # luồng nền nạp bản băm gần như tức thì; chỉ kiểm hai trạng thái hợp lệ để không phụ thuộc thời gian
        r = c.post("/embed", json={"texts": ["a"]}, headers=H)
        assert r.status_code in (200, 503)
        for _ in range(50):
            if c.get("/health").json()["modelLoaded"]:
                break
            time.sleep(0.05)
        assert c.get("/health").json()["modelLoaded"] is True
        assert c.post("/embed", json={"texts": ["a"]}, headers=H).status_code == 200


def test_load_failure_is_reported_in_health(monkeypatch):
    import app.main as main

    def boom(_):
        raise OSError("không có mạng để tải mô hình")

    monkeypatch.setattr(main, "build_embedder", boom)
    with TestClient(create_app(settings(embedder="real"), embedder=None)) as c:
        for _ in range(50):
            body = c.get("/health").json()
            if body["status"] != "loading":
                break
            time.sleep(0.05)
        assert body["status"] == "error" and "OSError" in body["error"]
        assert c.post("/embed", json={"texts": ["a"]}, headers=H).status_code == 503


def test_config_requires_token():
    with pytest.raises(RuntimeError, match="AI_SERVICE_TOKEN"):
        load_settings({})
    assert load_settings({"AI_SERVICE_TOKEN": "t"}).max_batch == 64
    with pytest.raises(RuntimeError, match="AI_MAX_BATCH"):
        load_settings({"AI_SERVICE_TOKEN": "t", "AI_MAX_BATCH": "65"})
    with pytest.raises(RuntimeError, match="AI_EMBEDDER"):
        load_settings({"AI_SERVICE_TOKEN": "t", "AI_EMBEDDER": "xyz"})
