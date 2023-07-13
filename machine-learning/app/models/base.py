from __future__ import annotations

import asyncio
import inspect
import logging
import time
from abc import ABC, abstractmethod
from functools import wraps
from pathlib import Path
from shutil import rmtree
from typing import Any, Awaitable, Callable, TypeVar
from concurrent.futures import ThreadPoolExecutor
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf  # type: ignore

from ..config import get_cache_dir
from ..schemas import ModelType

F = TypeVar("F")
P = TypeVar("P")
R = TypeVar("R")


# start = time.monotonic()
# async with lock:
#     batch: list[R] = []
#     batch_ids: list[int] = []
#     while len(batch) < max_size and time.monotonic() - start < timeout_s:
#         try:
#             cur = queue.get_nowait()
#             batch_ids.append(cur)
#             batch.append(processing.pop(cur))
#         except asyncio.QueueEmpty:
#             await asyncio.sleep(0)
#     if len(args) == 1:
#         output = await func(batch)
#     else:
#         output = await func(args[0], batch)
        
#     batch = []
# for i, id in enumerate(batch_ids):
#     processed[id] = output[i]


def batched(
    max_size: int = 16, timeout_s: float = 0.005
) -> Callable[[Callable[..., Awaitable[list[R]]]], Callable[..., Awaitable[R]]]:
    """
    Batches async calls into lists until the list reaches length
    `max_size` or `timeout_s` seconds pass, whichever comes first.
    Calls should pass an element as their only argument.
    Callables should take a list as their only argument and return a list of the same length.
    Inspired by Ray's @serve.batch decorator.
    """

    #  -> _Wrapped[Callable[[P], Awaitable[R]], Callable[[list[P]], Awaitable[list[R]]]]:
    #  -> Callable[[Callable[[P], Awaitable[R]]], Callable[[list[P]], Awaitable[list[R]]]]
    def decorator_factory(func: Callable[..., Awaitable[list[R]]]) -> Callable[..., Awaitable[R]]:
        func_args = inspect.getfullargspec(func).args
        is_method = func_args[0] == "self"

        if is_method and len(func_args) != 2:
            print(func_args)
            raise TypeError("Methods must take exactly two arguments (including `self`).")
        elif not is_method and len(func_args) != 1:
            print(func_args)
            raise TypeError(f"Functions must take exactly one argument. Got {func_args}")
        del func_args

        # thread_pool = ThreadPoolExecutor(max_workers=4)
        queue: asyncio.Queue[int] = asyncio.Queue(maxsize=max_size)
        lock = asyncio.Lock()
        element_id = 0
        processing: dict[int, Any] = {}
        processed = {}
        
        async def process(self: Any = None) -> None:
            start = time.monotonic()
            batch: list[Any] = []
            batch_ids: list[int] = []
            while len(batch) < max_size and time.monotonic() - start < timeout_s:
                try:
                    cur = queue.get_nowait()
                    batch_ids.append(cur)
                    batch.append(processing.pop(cur))
                except asyncio.QueueEmpty:
                    await asyncio.sleep(0)
            logging.getLogger('uvicorn.access').info(f'Batch size: {len(batch)}')
            if self:
                outputs = await func(self, batch)
                # outputs = await asyncio.get_running_loop().run_in_executor(thread_pool, lambda: func(self, batch))
            else:
                outputs = await func(batch)
            for i, id in enumerate(batch_ids):
                processed[id] = outputs[i]

        @wraps(func)
        async def decorator(*args: Any) -> R:
            nonlocal element_id

            cur_idx = element_id
            processing[cur_idx] = args[-1]
            element_id += 1
            await queue.put(cur_idx)
            while cur_idx not in processed:
                async with lock:
                    if is_method:
                        await process(args[0])
                    else:
                        await process()
    
            return processed.pop(cur_idx)

        return decorator

    return decorator_factory


class InferenceModel(ABC):
    _model_type: ModelType

    def __init__(self, model_name: str, cache_dir: Path | str | None = None, **model_kwargs: Any) -> None:
        self.model_name = model_name
        self._cache_dir = Path(cache_dir) if cache_dir is not None else get_cache_dir(model_name, self.model_type)

        try:
            self.load(**model_kwargs)
        except (OSError, InvalidProtobuf):
            self.clear_cache()
            self.load(**model_kwargs)

    @abstractmethod
    def load(self, **model_kwargs: Any) -> None:
        ...

    @abstractmethod
    def _predict_batch(self, inputs: list[Any]) -> list[Any]:
        ...

    @property
    def model_type(self) -> ModelType:
        return self._model_type

    @property
    def cache_dir(self) -> Path:
        return self._cache_dir

    @cache_dir.setter
    def cache_dir(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir

    @classmethod
    def from_model_type(cls, model_type: ModelType, model_name: str, **model_kwargs: Any) -> InferenceModel:
        subclasses = {subclass._model_type: subclass for subclass in cls.__subclasses__()}
        if model_type not in subclasses:
            raise ValueError(f"Unsupported model type: {model_type}")

        return subclasses[model_type](model_name, **model_kwargs)

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            return
        elif not rmtree.avoids_symlink_attacks:
            raise RuntimeError("Attempted to clear cache, but rmtree is not safe on this platform.")

        rmtree(self.cache_dir)
