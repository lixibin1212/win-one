import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export const ScriptAnalysisPanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResultText, setRawResultText] = useState('');
  const [shotBlocks, setShotBlocks] = useState<string[]>([]);

  const hasResult = useMemo(() => !!rawResultText.trim() || shotBlocks.length > 0, [rawResultText, shotBlocks.length]);

  const INPUT_CACHE_KEY = 'xgai.scriptAnalyze.inputText';
  const RESULT_RAW_CACHE_KEY = 'xgai.scriptAnalyze.rawResultText';
  const RESULT_SHOTS_CACHE_KEY = 'xgai.scriptAnalyze.shotBlocks';

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(INPUT_CACHE_KEY);
      if (cached && !inputText) setInputText(cached);
    } catch {
      // ignore
    }

    try {
      const cachedRaw = sessionStorage.getItem(RESULT_RAW_CACHE_KEY);
      if (cachedRaw && !rawResultText) setRawResultText(cachedRaw);
    } catch {
      // ignore
    }

    try {
      const cachedShots = sessionStorage.getItem(RESULT_SHOTS_CACHE_KEY);
      if (cachedShots && shotBlocks.length === 0) {
        const parsed = JSON.parse(cachedShots);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          setShotBlocks(parsed);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (inputText) sessionStorage.setItem(INPUT_CACHE_KEY, inputText);
      else sessionStorage.removeItem(INPUT_CACHE_KEY);
    } catch {
      // ignore
    }
  }, [inputText]);

  useEffect(() => {
    try {
      if (rawResultText) sessionStorage.setItem(RESULT_RAW_CACHE_KEY, rawResultText);
      else sessionStorage.removeItem(RESULT_RAW_CACHE_KEY);
    } catch {
      // ignore
    }
  }, [rawResultText]);

  useEffect(() => {
    try {
      if (shotBlocks.length) sessionStorage.setItem(RESULT_SHOTS_CACHE_KEY, JSON.stringify(shotBlocks));
      else sessionStorage.removeItem(RESULT_SHOTS_CACHE_KEY);
    } catch {
      // ignore
    }
  }, [shotBlocks]);

  const extractShotBlocks = (text: string): string[] => {
    const lines = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const blocks: string[] = [];
    let current: string[] | null = null;

    const isShotHeader = (line: string) => {
      const s = line.trim();
      if (!s) return false;
      // Match: 镜头1（全景）：...  OR  **镜头1（全景）：...**
      const normalized = s.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
      return /镜头\s*\d+\s*（[^）]+）\s*[:：]/.test(normalized);
    };

    for (const line of lines) {
      if (isShotHeader(line)) {
        if (current && current.join('\n').trim()) blocks.push(current.join('\n').trim());
        const header = line.trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
        current = [header];
        continue;
      }
      if (current) current.push(line);
    }
    if (current && current.join('\n').trim()) blocks.push(current.join('\n').trim());

    return blocks;
  };

  const buildHeaders = (withJson: boolean): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (withJson) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const canSubmit = useMemo(() => !!inputText.trim() && !isGenerating, [inputText, isGenerating]);

  const handleClear = () => {
    setInputText('');
    setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    setRawResultText('');
    setShotBlocks([]);

    if (!inputText.trim()) {
      setError('请输入推文/文章内容');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch(`${API_BASE}/api/proxy/xgai/script-analyze`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || '生成失败');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let acc = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setRawResultText(acc);
      }

      acc += decoder.decode();
      setRawResultText(acc);
      const blocks = extractShotBlocks(acc);
      setShotBlocks(blocks);
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateShotBlock = (index: number, nextValue: string) => {
    setShotBlocks((prev) => {
      const next = [...prev];
      next[index] = nextValue;
      return next;
    });
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '420px 1fr' },
        gap: 3,
        alignItems: 'start',
      }}
    >
      {/* 左侧：工作台 */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, fontSize: 18 }}>
          工作台
        </Typography>

        <TextField
          label="推文/文章内容"
          placeholder="粘贴需要分析的推文/文章全文"
          fullWidth
          multiline
          minRows={10}
          maxRows={10}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          InputLabelProps={{ sx: { fontSize: 12 } }}
          inputProps={{ style: { fontSize: 13, overflowY: 'auto', resize: 'none' } }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={handleClear} disabled={isGenerating} sx={{ flex: 1, py: 1.1 }}>
            清除
          </Button>
          <Button variant="contained" onClick={handleGenerate} disabled={!canSubmit} sx={{ flex: 2, py: 1.1 }}>
            {isGenerating ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                生成中
              </Box>
            ) : (
              '生成'
            )}
          </Button>
        </Box>
      </Paper>

      {/* 右侧：结果展示（高度自适应，内容多则自然向下撑开） */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          minHeight: { xs: 420, md: 620 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {hasResult && (
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, fontSize: 18 }}>
            生成结果
          </Typography>
        )}

        {!hasResult && !isGenerating && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              boxSizing: 'border-box',
            }}
          >
            <Typography color="text.secondary">结果将在这里展示</Typography>
          </Box>
        )}

        {isGenerating && !shotBlocks.length && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
              p: 3,
              boxSizing: 'border-box',
            }}
          >
            <CircularProgress size={28} />
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              生成中…
            </Typography>
          </Box>
        )}

        <Box sx={{ flex: 1, minHeight: 0 }}>
          {!!shotBlocks.length && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {shotBlocks.map((block, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(15, 23, 42, 0.10)',
                    bgcolor: 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    value={block}
                    onChange={(e) => updateShotBlock(idx, e.target.value)}
                    disabled={isGenerating}
                    InputLabelProps={{ sx: { fontSize: 12 } }}
                    inputProps={{ style: { fontSize: 13, lineHeight: 1.6 } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                  />
                </Paper>
              ))}
            </Box>
          )}

          {!!rawResultText && !shotBlocks.length && !isGenerating && (
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#0f172a',
              }}
            >
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                未识别到“镜头X（景别）：”格式的分镜，已展示原始结果：
              </Typography>
              {rawResultText}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ScriptAnalysisPanel;
