"""Dịch vụ AI nội bộ: GET /health, POST /embed. Chỉ API nghiệp vụ gọi, kèm header X-Internal-Token."""
import hmac
import threading
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .config import MAX_TEXT_CHARS, Settings, load_settings
from .embedder import Embedder, HashingEmbedder, SentenceTransformerEmbedder


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1)


class EmbedResponse(BaseModel):
    model: str
    dim: int
    vectors: list[list[float]]


def build_embedder(settings: Settings) -> Embedder:
    if settings.embedder == "fake":
        return HashingEmbedder()
    return SentenceTransformerEmbedder(settings.model_name, settings.model_cache, settings.max_tokens)


def create_app(settings: Settings | None = None, embedder: Embedder | None = None) -> FastAPI:
    """Nạp mô hình ở luồng nền: /health báo chưa sẵn sàng và /embed trả 503 cho tới khi nạp xong."""
    cfg = settings or load_settings()
    state: dict[str, object] = {"embedder": embedder, "error": None}

    def load() -> None:
        try:
            state["embedder"] = build_embedder(cfg)
        except Exception as e:  # noqa: BLE001 - ghi lại để /health báo, không để luồng nền chết im lặng
            state["error"] = f"{type(e).__name__}: {e}"

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if state["embedder"] is None:
            threading.Thread(target=load, name="model-loader", daemon=True).start()
        yield

    app = FastAPI(title="Farmery AI (nội bộ)", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    def require_token(x_internal_token: str | None = Header(default=None)) -> None:
        if x_internal_token is None or not hmac.compare_digest(x_internal_token.encode(), cfg.token.encode()):
            raise HTTPException(status_code=401, detail="Thiếu hoặc sai token nội bộ")

    @app.get("/health")
    def health() -> dict[str, object]:
        emb: Embedder | None = state["embedder"]  # type: ignore[assignment]
        return {
            "status": "ok" if emb is not None else ("error" if state["error"] else "loading"),
            "modelLoaded": emb is not None,
            "model": emb.name if emb else cfg.model_name,
            "dim": emb.dim if emb else None,
            "error": state["error"],
        }

    @app.post("/embed", response_model=EmbedResponse, dependencies=[Depends(require_token)])
    def embed(body: EmbedRequest) -> EmbedResponse:
        emb: Embedder | None = state["embedder"]  # type: ignore[assignment]
        if emb is None:
            raise HTTPException(status_code=503, detail="Mô hình chưa nạp xong", headers={"Retry-After": "5"})
        if len(body.texts) > cfg.max_batch:
            raise HTTPException(status_code=422, detail=f"Tối đa {cfg.max_batch} câu mỗi lần")
        if any(not t.strip() for t in body.texts):
            raise HTTPException(status_code=422, detail="Câu rỗng không nhúng được")
        if any(len(t) > MAX_TEXT_CHARS for t in body.texts):
            raise HTTPException(status_code=422, detail=f"Mỗi câu tối đa {MAX_TEXT_CHARS} ký tự")
        vectors = emb.embed(body.texts)
        return EmbedResponse(model=emb.name, dim=emb.dim, vectors=vectors.tolist())

    return app


def app_factory() -> FastAPI:
    """Điểm vào cho uvicorn: `uvicorn app.main:app_factory --factory --host 127.0.0.1`."""
    return create_app()
