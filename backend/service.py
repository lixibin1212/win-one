import httpx
import logging
from schemas import VideoGenerationRequest

logger = logging.getLogger(__name__)

API_BASE_URL = "https://api.xgai.site/v2/videos/generations"
API_KEY = "Bearer sk-pKzjE8Mz3UNxSWBd39s8DvXVNCf1g6v4CNbmhzb0Vv0koFVl"

VEO3_CREATE_URL = "http://jeniya.top/v1/video/create"
VEO3_QUERY_URL = "http://jeniya.top/v1/video/query"
VEO3_API_KEY = "Bearer sk-K2cYbvnzqURCnssu6oBcLLLkZPIE3c2KLsYskP7migplTQXK"

class VeoService:
    def __init__(self):
        self.headers_veo2 = {
            "Content-Type": "application/json",
            "Authorization": API_KEY
        }
        self.headers_veo3 = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": VEO3_API_KEY
        }

    async def generate_video(self, request: VideoGenerationRequest) -> str:
        """统一的视频生成方法，根据 model 字段区分行为。"""
        async with httpx.AsyncClient() as client:
            payload = request.dict()
            # 清理空 images 字段
            if not payload.get("images"):
                payload.pop("images", None)
            
            # 判断是否为 Veo3 (Jeniya) 系列模型
            # 注意：veo3-pro 等属于 XGAI 接口，所以这里需要精确匹配 Jeniya 的模型列表
            jeniya_models = ["veo3", "veo3-fast", "veo3-frames"]
            if request.model in jeniya_models:
                logger.info(f"Calling Veo3 (Jeniya) API with payload: {payload}")
                try:
                    response = await client.post(
                        VEO3_CREATE_URL,
                        json=payload,
                        headers=self.headers_veo3,
                        timeout=60.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    # Veo3 返回的是 id，统一映射为 task_id
                    return data.get("id")
                except httpx.HTTPStatusError as e:
                    logger.error(f"Veo3 API Error: {e.response.text}")
                    raise Exception(f"Veo3 API Error: {e.response.text}")
            else:
                # Veo2 / Veo3+ (XGAI) 逻辑
                logger.info(f"Calling XGAI API (Veo2/Veo3+) with payload: {payload}")
                try:
                    response = await client.post(
                        API_BASE_URL,
                        json=payload,
                        headers=self.headers_veo2,
                        timeout=60.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    return data.get("task_id")
                except httpx.HTTPStatusError as e:
                    logger.error(f"XGAI API Error: {e.response.text}")
                    raise Exception(f"XGAI API Error: {e.response.text}")

    async def get_task_status(self, task_id: str):
        """查询任务状态"""
        async with httpx.AsyncClient() as client:
            # 判断是否为 Veo3 任务 (Veo3 的 ID 通常包含 model 前缀，如 veo3-fast-frames:...)
            if task_id.startswith("veo3"):
                try:
                    # Veo3 使用 query param
                    response = await client.get(
                        VEO3_QUERY_URL,
                        params={"id": task_id},
                        headers=self.headers_veo3,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # 统一返回格式，确保前端能解析
                    # Veo3 返回结构: { "id":..., "detail": { "video_url": ..., "status": ... }, "status": ... }
                    # 我们需要把 detail 中的 video_url 提到外层或者让前端适配
                    # 这里做一个简单的适配，把 detail 里的 video_url 放到外层 data 中
                    if "detail" in data and isinstance(data["detail"], dict):
                        if "video_url" in data["detail"]:
                            data["video_url"] = data["detail"]["video_url"]
                        # 映射 status
                        if data["status"] == "video_upsampling" and data["detail"].get("video_generation_status") == "MEDIA_GENERATION_STATUS_SUCCESSFUL":
                             # 注意：Veo3 似乎有 upsampling 阶段，如果 video_url 有了，其实就可以播放了
                             pass
                    
                    return data
                except httpx.HTTPStatusError as e:
                    logger.error(f"Veo3 Get Task Status Error: {e.response.text}")
                    raise Exception(f"Veo3 Get Task Status Error: {e.response.text}")
            else:
                # Veo2 逻辑
                url = f"{API_BASE_URL}/{task_id}"
                try:
                    response = await client.get(
                        url,
                        headers=self.headers_veo2,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    logger.error(f"Veo2 Get Task Status Error: {e.response.text}")
                    raise Exception(f"Veo2 Get Task Status Error: {e.response.text}")

veo_service = VeoService()
