from typing import Any

from PIL.Image import Image
from sentence_transformers import SentenceTransformer

from ..schemas import ModelType
from .base import InferenceModel, batched


class CLIPSTEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def load(self, **model_kwargs: Any) -> None:
        self.model = SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir.as_posix(),
            **model_kwargs,
        )

    @batched()
    async def predict(self, inputs: list[Any]) -> list[Any]:
        return self._predict_batch(inputs)

    def _predict_batch(
        self,
        images_or_texts: list[Image] | list[str],
    ) -> list[list[float]]:
        return self.model.encode(images_or_texts).tolist()
