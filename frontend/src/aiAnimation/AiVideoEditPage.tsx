import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

type TaskType = 'depth' | 'pose' | 'face' | 'inpainting' | 'none';

type CreateResponse = {
  code?: number;
  message?: string;
  data?: {
    id?: string;
    status?: string;
    error?: string;
  };
};

type ResultResponse = {
  code?: number;
  message?: string;
  data?: {
    id?: string;
    status?: string;
    outputs?: string[];
    error?: string;
  };
};

type UiStatus = 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';

function parseLinesToUrls(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildRequirementsText(task: TaskType): string {
  switch (task) {
    case 'depth':
      return '必填：prompt、duration(5/10)、size；且 video 或 images 至少填一个（URL）。';
    case 'pose':
      return '必填：duration(5/10)、size；且 video 或 images 至少填一个（URL）。';
    case 'face':
      return '必填：duration(5/10)、size；且 video 或 images 至少填一个（URL）。';
    case 'inpainting':
      return '必填：duration(5/10)、size、video(URL)、mask_video(URL)。';
    case 'none':
    default:
      return '必填：prompt、duration(5/10)、size。';
  }
}

function validateForm(params: {
  task: TaskType;
  prompt: string;
  size: string;
  videoUrl: string;
  maskVideoUrl: string;
  images: string[];
}): string | null {
  const { task, prompt, size, videoUrl, maskVideoUrl, images } = params;

  if (!size.trim()) return '请填写 size（例如 832*480）。';

  const hasVideo = Boolean(videoUrl.trim());
  const hasImages = images.length > 0;

  if (task === 'depth') {
    if (!prompt.trim()) return 'depth 模式下 prompt 为必填。';
    if (!hasVideo && !hasImages) return 'depth 模式下 video 或 images 至少填写一个 URL。';
  }

  if (task === 'pose' || task === 'face') {
    if (!hasVideo && !hasImages) return `${task} 模式下 video 或 images 至少填写一个 URL。`;
  }

  if (task === 'inpainting') {
    if (!hasVideo) return 'inpainting 模式下 video 为必填（URL）。';
    if (!maskVideoUrl.trim()) return 'inpainting 模式下 mask_video 为必填（URL）。';
  }

  if (task === 'none') {
    if (!prompt.trim()) return 'none 模式下 prompt 为必填。';
  }

  return null;
}

export function AiVideoEditPage(props: { embedded?: boolean } = {}) {
  const embedded = Boolean(props.embedded);
  const [task, setTask] = useState<TaskType>('depth');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [duration, setDuration] = useState<5 | 10>(10);
  const [size, setSize] = useState('832*480');
  const [videoUrl, setVideoUrl] = useState('');
  const [maskVideoUrl, setMaskVideoUrl] = useState('');
  const [imagesText, setImagesText] = useState('');

  const [status, setStatus] = useState<UiStatus>('idle');
  const [predictionId, setPredictionId] = useState<string>('');
  const [resultStatus, setResultStatus] = useState<string>('');
  const [outputUrl, setOutputUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const pollTimerRef = useRef<number | null>(null);

  const images = useMemo(() => parseLinesToUrls(imagesText), [imagesText]);
  const requirementsText = useMemo(() => buildRequirementsText(task), [task]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!predictionId) return;
    if (status !== 'processing' && status !== 'submitting') return;

    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const pollOnce = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/proxy/wavespeed/predictions/${encodeURIComponent(predictionId)}/result`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const json = (await res.json()) as ResultResponse;
        const nextStatus = json?.data?.status || '';
        setResultStatus(nextStatus);

        const apiError = json?.data?.error || json?.message;
        if (!res.ok) {
          throw new Error(apiError || `查询失败（HTTP ${res.status}）`);
        }

        if (nextStatus === 'failed') {
          setStatus('failed');
          setError(apiError || '任务失败');
          return;
        }

        if (nextStatus === 'completed') {
          const url = json?.data?.outputs?.[0] || '';
          setOutputUrl(url);
          setStatus('completed');
        } else {
          setStatus('processing');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : '查询结果失败';
        setStatus('failed');
        setError(message);
      }
    };

    void pollOnce();
    pollTimerRef.current = window.setInterval(() => {
      void pollOnce();
    }, 2000);

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [predictionId, status]);

  const resetResult = () => {
    setPredictionId('');
    setResultStatus('');
    setOutputUrl('');
    setError('');
    setStatus('idle');
    setHasSubmitted(false);
  };

  const onSubmit = async () => {
    setError('');
    setOutputUrl('');
    setResultStatus('');

    const validationError = validateForm({
      task,
      prompt,
      size,
      videoUrl,
      maskVideoUrl,
      images,
    });
    if (validationError) {
      setStatus('failed');
      setError(validationError);
      return;
    }

    setHasSubmitted(true);
    setStatus('submitting');
    try {
      const payload: Record<string, unknown> = {
        task,
        duration,
        size,
      };

      if (prompt.trim()) payload.prompt = prompt.trim();
      if (negativePrompt.trim()) payload.negative_prompt = negativePrompt.trim();
      if (videoUrl.trim()) payload.video = videoUrl.trim();
      if (maskVideoUrl.trim()) payload.mask_video = maskVideoUrl.trim();
      if (images.length > 0) payload.images = images;

      const res = await fetch(`${API_BASE}/api/proxy/wavespeed/vace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as CreateResponse;
      const apiError = json?.data?.error || json?.message;
      if (!res.ok) {
        throw new Error(apiError || `创建任务失败（HTTP ${res.status}）`);
      }

      const id = json?.data?.id;
      if (!id) {
        throw new Error(apiError || '创建任务成功但未返回 id');
      }

      setPredictionId(id);
      setStatus('processing');
    } catch (e) {
      const message = e instanceof Error ? e.message : '创建任务失败';
      setStatus('failed');
      setError(message);
    }
  };

  const isBusy = status === 'submitting' || status === 'processing';
  const showResultHeader = hasSubmitted;

  return (
    <Box sx={embedded ? { px: 0, py: 0 } : { px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {!embedded && (
          <>
            <Typography variant="h5">AI 视频编辑（Wavespeed VACE）</Typography>
            <Divider />
          </>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <Paper
            sx={{
              p: 4,
              minWidth: 320,
              borderRadius: 4,
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: { xs: 'auto', md: '42%' },
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>工作台</Typography>
                <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                  {requirementsText}
                </Alert>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel id="task-label">模式（task）</InputLabel>
                <Select
                  labelId="task-label"
                  label="模式（task）"
                  value={task}
                  onChange={(e: SelectChangeEvent) => {
                    setTask(e.target.value as TaskType);
                    resetResult();
                  }}
                >
                  <MenuItem value="depth">depth</MenuItem>
                  <MenuItem value="pose">pose</MenuItem>
                  <MenuItem value="face">face</MenuItem>
                  <MenuItem value="inpainting">inpainting</MenuItem>
                  <MenuItem value="none">none</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label={task === 'depth' || task === 'none' ? 'prompt（必填）' : 'prompt（可选）'}
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPrompt(e.target.value)}
                placeholder="请输入 prompt"
                fullWidth
                multiline
                minRows={3}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="duration-label">duration（秒）</InputLabel>
                  <Select
                    labelId="duration-label"
                    label="duration（秒）"
                    value={String(duration)}
                    onChange={(e: SelectChangeEvent) => setDuration((Number(e.target.value) as 5 | 10) ?? 10)}
                  >
                    <MenuItem value="5">5</MenuItem>
                    <MenuItem value="10">10</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="size（例如 832*480）"
                  value={size}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
                  placeholder="请输入分辨率"
                  fullWidth
                  size="small"
                />
              </Stack>

              <TextField
                label={task === 'inpainting' ? 'video（必填，URL）' : 'video（URL）'}
                value={videoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(e.target.value)}
                placeholder="请输入视频 URL"
                fullWidth
                size="small"
              />

              {task === 'inpainting' && (
                <TextField
                  label="mask_video（必填，URL）"
                  value={maskVideoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaskVideoUrl(e.target.value)}
                  placeholder="请输入遮罩视频 URL"
                  fullWidth
                  size="small"
                />
              )}

              {(task === 'depth' || task === 'pose' || task === 'face') && (
                <TextField
                  label="images（参考图片URL，可多张）"
                  value={imagesText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setImagesText(e.target.value)}
                  placeholder="请输入图片 URL&#10;一行一个&#10;请勿使用逗号分隔"
                  helperText="请确保每行只填写一个图片 URL，不要使用逗号分隔"
                  fullWidth
                  multiline
                  minRows={3}
                />
              )}

              <Divider />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>高级参数（可选）</Typography>

              <TextField
                label="negative_prompt"
                value={negativePrompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNegativePrompt(e.target.value)}
                placeholder="可选"
                fullWidth
                multiline
                minRows={6}
                size="small"
              />

              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={resetResult}
                  disabled={isBusy && !error}
                  size="large"
                  sx={{
                    minWidth: 100,
                    color: 'text.secondary',
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    '&:hover': {
                      borderColor: 'text.primary',
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  清除
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void onSubmit()}
                  disabled={isBusy}
                  size="large"
                  sx={{ flexGrow: 1, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                  {status === 'submitting' ? '提交中…' : '生成'}
                </Button>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Paper>

          <Paper
            sx={{
              p: 2,
              minWidth: 320,
              borderRadius: 4,
              flexGrow: 1,
              flexBasis: { xs: 'auto', md: '58%' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              {showResultHeader && <Typography variant="h6">生成结果</Typography>}

              {!hasSubmitted && (
                <Box
                  sx={{
                    minHeight: { xs: 300, md: 500 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    结果将在这里展示
                  </Typography>
                </Box>
              )}

              {hasSubmitted && isBusy && (
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CircularProgress size={22} />
                      <Typography variant="body2">生成中，请稍候（每 2 秒轮询一次）…</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {hasSubmitted && status === 'completed' && outputUrl && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    输出视频
                  </Typography>
                  <video controls src={outputUrl} style={{ width: '100%', maxHeight: 520 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all' }}>
                    {outputUrl}
                  </Typography>
                </Box>
              )}

              {hasSubmitted && status === 'completed' && !outputUrl && <Alert severity="warning">任务完成但 outputs[0] 为空</Alert>}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
