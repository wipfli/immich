import asyncio
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import Any

import cv2
import numpy as np
from fastapi import Body, Depends, FastAPI
from PIL import Image

from app.models.cache import ModelCache

from .config import settings
from .models.base import InferenceModel
from .schemas import (
    EmbeddingResponse,
    FaceResponse,
    MessageResponse,
    ModelType,
    TagResponse,
    TextModelRequest,
    TextResponse,
)

app = FastAPI()


def init_state() -> None:
    app.state.last_called = None
    app.state.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=settings.model_ttl > 0)
    app.state.thread_pool = ThreadPoolExecutor()


@app.on_event("startup")
async def startup_event() -> None:
    init_state()
    if settings.model_ttl > 0:
        await schedule_idle_shutdown()


def dep_pil_image(byte_image: bytes = Body(...)) -> Image.Image:
    return Image.open(BytesIO(byte_image))


def dep_cv_image(byte_image: bytes = Body(...)) -> cv2.Mat:
    byte_image_np = np.frombuffer(byte_image, np.uint8)
    return cv2.imdecode(byte_image_np, cv2.IMREAD_COLOR)


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post(
    "/image-classifier/tag-image",
    response_model=TagResponse,
    status_code=200,
)
async def image_classification(
    image: Image.Image = Depends(dep_pil_image),
) -> list[str]:
    model = await app.state.model_cache.get(settings.classification_model, ModelType.IMAGE_CLASSIFICATION)
    labels = await run_in_thread(model, image)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_image(
    image: Image.Image = Depends(dep_pil_image),
) -> list[float]:
    model = await app.state.model_cache.get(settings.clip_image_model, ModelType.CLIP)
    embedding = await run_in_thread(model, image)
    return embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_text(payload: TextModelRequest) -> list[float]:
    model = await app.state.model_cache.get(settings.clip_text_model, ModelType.CLIP)
    embedding = await run_in_thread(model, payload.text)
    return embedding


@app.post(
    "/facial-recognition/detect-faces",
    response_model=FaceResponse,
    status_code=200,
)
async def facial_recognition(
    image: cv2.Mat = Depends(dep_cv_image),
) -> list[dict[str, Any]]:
    model = await app.state.model_cache.get(settings.facial_recognition_model, ModelType.FACIAL_RECOGNITION)
    faces = await run_in_thread(model, image)
    return faces


async def run_in_thread(model: InferenceModel, inputs) -> Any:
    outputs = await asyncio.get_running_loop().run_in_executor(app.state.thread_pool, lambda: model.predict(inputs))
    app.state.last_called = time.time()
    return outputs


async def schedule_idle_shutdown() -> None:
    async def idle_shutdown() -> None:
        while True:
            if app.state.last_called is not None and time.time() - app.state.last_called > settings.model_ttl:
                sys.stderr.close()
                sys.stdout.close()
                sys.stdout = sys.stderr = open(os.devnull, "w")
                exit()

            await asyncio.sleep(settings.shutdown_poll_s)

    task = asyncio.get_event_loop().create_task(idle_shutdown())
    asyncio.ensure_future(task)
