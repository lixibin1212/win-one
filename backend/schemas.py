from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class VideoGenerationRequest(BaseModel):
    """统一的视频生成请求模型，支持两种模型：
    - model = "veo2"：仅文本
    - model = "veo2-fast-frames"：文本 + 可选首尾帧图片
    """
    prompt: str
    model: str = "veo2"  # 默认使用 veo2
    aspect_ratio: str = "16:9"
    enhance_prompt: bool = True
    enable_upsample: bool = True  # 仅在 veo2 下生效，传入也不会报错
    images: Optional[List[str]] = None  # 在 veo2-fast-frames 下可选传 1 或 2 张

class TaskResponse(BaseModel):
    task_id: str

class GenerationResult(BaseModel):
    id: str
    status: str
    video_url: Optional[str] = None
    # 根据实际 API 返回补充字段
