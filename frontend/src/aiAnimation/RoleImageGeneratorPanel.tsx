import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const RESULT_HISTORY_STORAGE_KEY = 'x-role-image-result-history-v1';

type EngineType = 'banana' | 'mj';

type ResultItem = {
  id: string;
  engine: EngineType;
  createdAt: number;
  urls: string[];
};

type BananaResponse = {
  data?: Array<{ url?: string }>;
  task_id?: string;
};

type MjSubmitResponse = {
  task_id: string;
};

type MjFetchResponse = {
  status?: string;
  progress?: string;
  failReason?: string;
  imageUrl?: string;
  imageUrls?: Array<{ url?: string }>;
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  if (idx < 0) return dataUrl;
  return dataUrl.slice(idx + 1);
}

export const RoleImageGeneratorPanel: React.FC = () => {
  const [engine, setEngine] = useState<EngineType>('banana');
  const [prompt, setPrompt] = useState('');

  const [refImages, setRefImages] = useState<Array<{ name: string; dataUrl: string; base64: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bananaUrls, setBananaUrls] = useState<string[]>([]);
  const [mjTaskId, setMjTaskId] = useState<string | null>(null);
  const [mjStatus, setMjStatus] = useState<string>('');
  const [mjProgress, setMjProgress] = useState<string>('');
  const [mjFailReason, setMjFailReason] = useState<string>('');
  const [mjUrls, setMjUrls] = useState<string[]>([]);

  const [resultHistory, setResultHistory] = useState<ResultItem[]>([]);
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);

  const mjProgressLabel = useMemo(() => {
    const raw = String(mjProgress || '').trim();
    if (!raw) return '';
    const matched = raw.match(/\d+(?:\.\d+)?/);
    if (!matched) return '';
    const n = Number(matched[0]);
    if (!Number.isFinite(n)) return '';
    const display = Number.isInteger(n) ? String(n) : String(Math.round(n));
    return `${display}%`;
  }, [mjProgress]);

  const uploadLimit = useMemo(() => (engine === 'mj' ? 4 : 11), [engine]);

  const resetRunState = () => {
    setBananaUrls([]);
    setMjTaskId(null);
    setMjStatus('');
    setMjProgress('');
    setMjFailReason('');
    setMjUrls([]);
  };

  const addResultToHistory = (resultEngine: EngineType, urls: string[]) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item: ResultItem = { id, engine: resultEngine, createdAt: Date.now(), urls };
    setResultHistory((prev) => {
      const next = [...prev, item];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
  };

  const removeResultFromHistory = (id: string) => {
    setResultHistory((prev) => prev.filter((x) => x.id !== id));
  };

  const rainbowMaskContainerSx = {
    '@keyframes rainbowShift': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  } as const;

  const placeholderCardSx = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
    border: '1px dashed #cbd5e1',
    bgcolor: '#f8fafc',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(120deg, rgba(255,0,128,0.35), rgba(0,200,255,0.35), rgba(0,255,128,0.35), rgba(255,230,0,0.35), rgba(255,0,128,0.35))',
      backgroundSize: '300% 300%',
      animation: 'rainbowShift 2.6s ease-in-out infinite',
      filter: 'blur(0px)',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.55)',
    },
  } as const;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESULT_HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ResultItem[];
      if (Array.isArray(parsed)) {
        setResultHistory(
          parsed
            .filter((x) => x && typeof x === 'object' && Array.isArray((x as any).urls))
            .slice(-20)
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RESULT_HISTORY_STORAGE_KEY, JSON.stringify(resultHistory));
    } catch {
      // ignore
    }
  }, [resultHistory]);

  useEffect(() => {
    const el = resultsScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [resultHistory.length, isGenerating]);

  const pickFiles = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);

    const remaining = uploadLimit - refImages.length;
    const selected = Array.from(files).slice(0, Math.max(0, remaining));
    if (selected.length === 0) {
      setError(`最多只能上传 ${uploadLimit} 张参考图`);
      return;
    }

    try {
      const items = await Promise.all(
        selected.map(async (f) => {
          const dataUrl = await fileToDataUrl(f);
          return { name: f.name, dataUrl, base64: dataUrlToBase64(dataUrl) };
        })
      );
      setRefImages((prev) => [...prev, ...items]);
    } catch (e: any) {
      setError(e?.message || '图片处理失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeRefImage = (idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildHeaders = (withJson: boolean): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (withJson) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleGeminiAnalyze = async () => {
    setError(null);

    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    setIsAnalyzing(true);

    try {
      const res = await fetch(`${API_BASE}/api/proxy/gemini/analyze`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ text: prompt }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Gemini 分析失败');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPrompt(acc);
      }
      acc += decoder.decode();
      setPrompt(acc);
    } catch (e: any) {
      setError(e?.message || 'Gemini 分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pollMj = async (taskId: string): Promise<string[]> => {
    const startAt = Date.now();
    const timeoutMs = 120_000;

    while (Date.now() - startAt < timeoutMs) {
      const res = await fetch(`${API_BASE}/api/proxy/mj/task/${encodeURIComponent(taskId)}/fetch`, {
        headers: buildHeaders(false),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'MJ 查询失败');
      }

      const data = (await res.json()) as MjFetchResponse;
      const status = String(data.status || '').toUpperCase();
      setMjStatus(status);
      setMjProgress(data.progress || '');
      setMjFailReason(data.failReason || '');

      if (status === 'SUCCESS') {
        const urls = (data.imageUrls || []).map((x) => x.url).filter(Boolean) as string[];
        setMjUrls(urls.slice(0, 4));
        return urls.slice(0, 4);
      }
      if (status === 'FAIL' || status === 'FAILED' || status === 'FAILURE') {
        throw new Error(data.failReason || 'MJ 生成失败');
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error('MJ 生成超时');
  };

  const handleGenerate = async () => {
    setError(null);
    resetRunState();

    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    setIsGenerating(true);

    try {
      if (engine === 'banana') {
        const res = await fetch(`${API_BASE}/api/proxy/nano/generate`, {
          method: 'POST',
          headers: buildHeaders(true),
          body: JSON.stringify({
            model: 'nano-banana-2',
            prompt,
            aspect_ratio: '9:16',
            image_size: '1K',
            images: refImages.map((x) => x.dataUrl).slice(0, 11),
          }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || 'NanoBanana 生成失败');
        }

        const data = (await res.json()) as BananaResponse;
        const urls = (data.data || []).map((x) => x.url).filter(Boolean) as string[];
        setBananaUrls(urls);
        if (urls.length === 0) throw new Error('NanoBanana 未返回图片');
        addResultToHistory('banana', urls);
        return;
      }

      // MJ
      const submitRes = await fetch(`${API_BASE}/api/proxy/mj/submit/imagine`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          prompt,
          botType: 'MID_JOURNEY',
          base64Array: refImages.map((x) => x.base64).slice(0, 4),
        }),
      });

      if (!submitRes.ok) {
        const msg = await submitRes.text().catch(() => '');
        throw new Error(msg || 'MJ 提交失败');
      }

      const submitData = (await submitRes.json()) as MjSubmitResponse;
      setMjTaskId(submitData.task_id);
      setMjStatus('SUBMITTED');

      const urls = await pollMj(submitData.task_id);
      if (urls.length > 0) addResultToHistory('mj', urls);
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const rightContent = () => {
    const mediaMaxHeight = { xs: 260, md: 460 } as const;
    const singleCardWidth = { xs: '92%', md: 380 } as const;
    return (
      <Box
        ref={resultsScrollRef}
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          pr: 1,
        }}
      >
        {resultHistory.length === 0 && !isGenerating && (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">结果将在这里展示</Typography>
          </Box>
        )}

        {resultHistory.map((item) => {
          const isBanana = item.engine === 'banana';
          const urls = item.urls || [];
          return (
            <Box
              key={item.id}
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: isBanana ? singleCardWidth : undefined,
                  maxWidth: '92%',
                  '& .result-close': { opacity: 0, transition: 'opacity 120ms ease' },
                  '&:hover .result-close': { opacity: 1 },
                  '&:focus-within .result-close': { opacity: 1 },
                }}
              >
                {isBanana ? (
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      maxWidth: '100%',
                    }}
                  >
                    <Button
                      className="result-close"
                      size="small"
                      variant="contained"
                      onClick={() => {
                        removeResultFromHistory(item.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        minWidth: 'auto',
                        width: 28,
                        height: 28,
                        p: 0,
                        borderRadius: 999,
                        bgcolor: 'rgba(15, 23, 42, 0.75)',
                        color: 'white',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)', boxShadow: 'none' },
                      }}
                    >
                      ×
                    </Button>

                    <Box
                      component="img"
                      src={urls[0]}
                      alt="result"
                      sx={{
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: mediaMaxHeight,
                        borderRadius: 2,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gridTemplateRows: '1fr 1fr',
                      gap: 1.5,
                      width: 520,
                      maxWidth: '100%',
                    }}
                  >
                    <Button
                      className="result-close"
                      size="small"
                      variant="contained"
                      onClick={() => {
                        removeResultFromHistory(item.id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        minWidth: 'auto',
                        width: 28,
                        height: 28,
                        p: 0,
                        borderRadius: 999,
                        bgcolor: 'rgba(15, 23, 42, 0.75)',
                        color: 'white',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)', boxShadow: 'none' },
                      }}
                    >
                      ×
                    </Button>

                    {[0, 1, 2, 3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          bgcolor: '#f8fafc',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: { xs: 120, md: 160 },
                        }}
                      >
                        {urls[i] ? (
                          <Box component="img" src={urls[i]} alt={`mj-${i}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Typography color="text.secondary">空</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}

        {isGenerating && (
          <Box
            sx={{
              ...rainbowMaskContainerSx,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {engine === 'mj' ? (
              <Box
                sx={{
                  width: 520,
                  maxWidth: '92%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                  position: 'relative',
                }}
              >
                {mjProgressLabel && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      px: 1,
                      py: 0.4,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(226,232,240,0.9)',
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: 12,
                      lineHeight: 1,
                      userSelect: 'none',
                    }}
                  >
                    {mjProgressLabel}
                  </Box>
                )}
                {[0, 1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      ...placeholderCardSx,
                      aspectRatio: '1 / 1',
                      minHeight: { xs: 120, md: 160 },
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  width: singleCardWidth,
                  maxWidth: '92%',
                  ...placeholderCardSx,
                  height: mediaMaxHeight,
                }}
              />
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px 1fr' }, gap: 3, alignItems: 'stretch' }}>
      {/* 左侧：工作台 */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.6)', borderRadius: '16px' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, fontSize: 18 }}>
          工作台
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="engine-label" sx={{ fontSize: 11 }}>
            生成引擎
          </InputLabel>
          <Select
            labelId="engine-label"
            label="生成引擎"
            value={engine}
            sx={{ '& .MuiSelect-select': { fontSize: 13 } }}
            MenuProps={{
              PaperProps: {
                sx: {
                  '& .MuiMenuItem-root': { fontSize: 13 },
                },
              },
            }}
            onChange={(e) => {
              const v = e.target.value as EngineType;
              setEngine(v);
              setRefImages([]);
              resetRunState();
            }}
          >
            <MenuItem value="banana" sx={{ fontSize: 13 }}>
              NanoBanana
            </MenuItem>
            <MenuItem value="mj" sx={{ fontSize: 13 }}>
              MJ
            </MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ position: 'relative', mb: 2 }}>
          <TextField
            label="提示词"
            multiline
            minRows={6}
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入非结构化描述，点击 提示词结构化 可转为结构化绘图语言"
            InputLabelProps={{ sx: { fontSize: 12 } }}
            inputProps={{ style: { fontSize: 13 } }}
            sx={{
              '& .MuiInputBase-inputMultiline': {
                paddingBottom: '36px',
              },
            }}
          />

          <Button
            variant="text"
            size="small"
            onClick={handleGeminiAnalyze}
            disabled={isAnalyzing || isGenerating}
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              minWidth: 'auto',
              px: 1,
              fontWeight: 700,
              fontSize: 12,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'transparent', color: '#7f7b6efc' },
            }}
          >
            {isAnalyzing ? '结构化中...' : '提示词结构化'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setPrompt('')}
            disabled={!prompt.trim() || isGenerating || isAnalyzing}
            sx={{ fontWeight: 800, px: 3 }}
          >
            清除
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating || isAnalyzing}
            sx={{ fontWeight: 900, flex: 1 }}
          >
            {isGenerating ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                生成中
              </Box>
            ) : (
              '生成'
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            参考图（最多 {uploadLimit} 张）
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => setRefImages([])}
            disabled={refImages.length === 0 || isGenerating || isAnalyzing}
            sx={{
              minWidth: 'auto',
              px: 1,
              fontWeight: 700,
              fontSize: 12,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'transparent' },
            }}
          >
            清空
          </Button>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => onFilesSelected(e.target.files)}
        />

        {(() => {
          const uploadDisabled = refImages.length >= uploadLimit || isGenerating || isAnalyzing;
          return (
            <Box
              role="button"
              tabIndex={0}
              aria-disabled={uploadDisabled}
              onClick={() => {
                if (uploadDisabled) return;
                pickFiles();
              }}
              onKeyDown={(e) => {
                if (uploadDisabled) return;
                if (e.key === 'Enter' || e.key === ' ') pickFiles();
              }}
              sx={{
                width: 'fit-content',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                px: 2.5,
                mb: 1.5,
                borderRadius: 2,
                border: '1px dashed #cbd5e1',
                bgcolor: 'transparent',
                cursor: uploadDisabled ? 'not-allowed' : 'pointer',
                opacity: uploadDisabled ? 0.5 : 1,
                userSelect: 'none',
                '&:hover': {
                  bgcolor: uploadDisabled ? 'transparent' : '#f8fafc',
                },
                '&:focus-visible': {
                  outline: '2px solid #93c5fd',
                  outlineOffset: 2,
                },
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'primary.main' }}>上传参考图</Typography>
            </Box>
          );
        })()}

        {refImages.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.2, mb: 2 }}>
            {refImages.map((img, idx) => (
              <Box key={`${img.name}-${idx}`} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={img.dataUrl}
                  alt={img.name}
                  sx={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0' }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => removeRefImage(idx)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 'auto',
                    px: 1,
                    py: 0,
                    lineHeight: 1.4,
                    borderRadius: 2,
                    bgcolor: '#0f172a',
                    '&:hover': { bgcolor: '#0b1220' },
                  }}
                >
                  ×
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {engine === 'mj' && (mjTaskId || mjStatus) && (
          <Alert severity="info" sx={{ mt: 1 }}>
            MJ 状态：{mjStatus || '-'}
            {mjTaskId ? ` | 任务ID：${mjTaskId}` : ''}
            {mjFailReason ? ` | 失败原因：${mjFailReason}` : ''}
          </Alert>
        )}

      </Paper>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setError(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setError(null)}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 右侧：结果展示 */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          position: 'relative',
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          minHeight: { xs: 360, md: 560 },
        }}
      >
        {resultHistory.length > 0 && (
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
            结果展示
          </Typography>
        )}
        <Box sx={{ height: { xs: 320, md: 520 } }}>{rightContent()}</Box>
      </Paper>
    </Box>
  );
};
