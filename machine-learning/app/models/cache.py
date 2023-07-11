import asyncio
import time
from functools import wraps
from typing import Any

from aiocache.backends.memory import SimpleMemoryCache
from aiocache.lock import OptimisticLock
from aiocache.plugins import BasePlugin, TimingPlugin

from ..schemas import ModelType
from .base import InferenceModel


class ModelCache:
    """Fetches a model from an in-memory cache, instantiating it if it's missing."""

    def __init__(
        self,
        ttl: float | None = None,
        revalidate: bool = False,
        timeout: int | None = None,
        profiling: bool = False,
    ):
        """
        Args:
            ttl: Unloads model after this duration. Disabled if None. Defaults to None.
            revalidate: Resets TTL on cache hit. Useful to keep models in memory while active. Defaults to False.
            timeout: Maximum allowed time for model to load. Disabled if None. Defaults to None.
            profiling: Collects metrics for cache operations, adding slight overhead. Defaults to False.
        """

        self.ttl = ttl
        plugins = []

        if revalidate:
            plugins.append(RevalidationPlugin())
        if profiling:
            plugins.append(TimingPlugin())

        self.cache = SimpleMemoryCache(ttl=ttl, timeout=timeout, plugins=plugins, namespace=None)

    async def get(self, model_name: str, model_type: ModelType, **model_kwargs: Any) -> InferenceModel:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """

        key = self.cache.build_key(model_name, model_type.value)
        model = await self.cache.get(key)
        if model is None:
            async with OptimisticLock(self.cache, key) as lock:
                model = InferenceModel.from_model_type(model_type, model_name, **model_kwargs)
                await lock.cas(model, ttl=self.ttl)
        return model

    async def get_profiling(self) -> dict[str, float] | None:
        if not hasattr(self.cache, "profiling"):
            return None

        return self.cache.profiling  # type: ignore


class RevalidationPlugin(BasePlugin):
    """Revalidates cache item's TTL after cache hit."""

    async def post_get(
        self,
        client: SimpleMemoryCache,
        key: str,
        ret: Any | None = None,
        namespace: str | None = None,
        **kwargs: Any,
    ) -> None:
        if ret is None:
            return
        if namespace is not None:
            key = client.build_key(key, namespace)
        if key in client._handlers:
            await client.expire(key, client.ttl)

    async def post_multi_get(
        self,
        client: SimpleMemoryCache,
        keys: list[str],
        ret: list[Any] | None = None,
        namespace: str | None = None,
        **kwargs: Any,
    ) -> None:
        if ret is None:
            return

        for key, val in zip(keys, ret):
            if namespace is not None:
                key = client.build_key(key, namespace)
            if val is not None and key in client._handlers:
                await client.expire(key, client.ttl)


def batched(max_size: int = 16, timeout_s: float = 0.01):
    """
    Batches async calls into lists until the list reaches length `max_size` or `timeout_s` seconds pass, whichever comes first. 
    Calls should pass an element as their only argument.
    Callables should take a list as their only argument and return a list of the same length.
    Inspired by Ray's @serve.batch decorator.
    """

    def decorator_factory(func):
        queue = asyncio.Queue(maxsize=max_size)
        lock = asyncio.Lock()
        output = None
        element_id = 0
        processing = {}
        processed = {}
        batch = []

        @wraps(func)
        async def decorator(element):
            nonlocal element_id
            nonlocal batch
            nonlocal output

            cur_idx = element_id
            processing[cur_idx] = element
            element_id += 1
            await queue.put(cur_idx)
            while cur_idx not in processed:
                start = time.monotonic()
                async with lock:
                    batch_ids = []
                    while len(batch) < max_size and time.monotonic() - start < timeout_s:
                        try:
                            cur = queue.get_nowait()
                            batch_ids.append(cur)
                            batch.append(processing.pop(cur))
                        except asyncio.QueueEmpty:
                            await asyncio.sleep(0)
                    output = await func(batch)
                    batch = []
                    for i, id in enumerate(batch_ids):
                        processed[id] = output[i]
            return processed.pop(cur_idx)
        return decorator
    return decorator_factory


def batched_method(max_size: int = 16, timeout_s: float = 0.001):
    """
    Batches async calls into lists until the list reaches length `max_size` or `timeout_s` seconds pass, whichever comes first. 
    Calls should pass an element as their only argument.
    Callables should take a list as their only argument and return a list of the same length.
    Inspired by Ray's @serve.batch decorator.
    """

    def decorator_factory(func):
        queue = asyncio.Queue(maxsize=max_size)
        lock = asyncio.Lock()
        output = None
        element_id = 0
        processing = {}
        processed = {}
        batch = []

        @wraps(func)
        async def decorator(self, element):
            nonlocal element_id
            nonlocal batch
            nonlocal output

            cur_idx = element_id
            processing[cur_idx] = element
            element_id += 1
            await queue.put(cur_idx)
            while cur_idx not in processed:
                start = time.monotonic()
                async with lock:
                    batch_ids = []
                    while len(batch) < max_size and time.monotonic() - start < timeout_s:
                        try:
                            cur = queue.get_nowait()
                            batch_ids.append(cur)
                            batch.append(processing.pop(cur))
                        except asyncio.QueueEmpty:
                            await asyncio.sleep(0)
                    output = await func(self, batch)
                    batch = []
                    for i, id in enumerate(batch_ids):
                        processed[id] = output[i]
            return processed.pop(cur_idx)
        return decorator
    return decorator_factory