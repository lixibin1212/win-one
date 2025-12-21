import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Avatar,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Snackbar,
  keyframes
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MovieCreationIcon from '@mui/icons-material/MovieCreation';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import { createClient } from '@supabase/supabase-js';
import ThreeDCarousel from './ThreeDCarousel';
import { useAuth } from './AuthContext';

// 带加载占位的轻量视频组件
const VideoWithLoader: React.FC<{
  src: string;
  autoPlay?: boolean;
  loop?: boolean;
  style?: React.CSSProperties;
}> = ({ src, autoPlay = false, loop = true, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 加载态占位：深色卡片 + 微扫光 + 文字 */}
      {(loading && !error) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0b1220',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
              transform: 'skewX(-20deg)',
              animation: `${shine} 1.8s linear infinite`,
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: 'relative',
              zIndex: 1,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: 1,
              animation: `${blink} 2.4s ease-in-out infinite`,
            }}
          >
            加载中...
          </Typography>
        </Box>
      )}

      {/* 错误占位 */}
      {error && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b' }}>
          <Typography variant="caption" color="error.main">视频加载失败</Typography>
        </Box>
      )}

      <video
        controls
        autoPlay={autoPlay}
        loop={loop}
        style={style}
        src={src}
        playsInline
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => setError('failed')}
      />
    </Box>
  );
};

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#10b981' },
    background: { default: '#f5f8fc' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 500 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { transition: 'box-shadow .25s, transform .25s' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          // 保持原有圆角设置，不进行修改
        },
        containedPrimary: {
          // 微光按钮：纯正蓝色渐变 + 内发光 + 同色系投影
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)'
          }
        }
      }
    }
  }
});

// 扫光动画
const shine = keyframes`
  0% { left: -100%; }
  100% { left: 200%; }
`;

// 边框流光动画
const borderMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// 运行态：闪烁文字
const blink = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
`;

// 轻量卡片通用样式
const cardBase = {
  p: 3,
  // 增加通透感
  bgcolor: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  // Deep Elevation: 大扩散、低透明度的双层阴影，营造悬浮感
  boxShadow: '0 20px 40px -4px rgba(37, 99, 235, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.05)',
  borderRadius: '16px', // 保持圆角不变
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    // 悬浮时阴影加深并扩散
    boxShadow: '0 30px 60px -8px rgba(37, 99, 235, 0.15), 0 12px 24px -6px rgba(0, 0, 0, 0.08)',
    // transform: 'translateY(-4px)', // 移除上浮效果
    borderColor: 'rgba(255, 255, 255, 0.9)'
  }
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
// Supabase 配置
const SUPABASE_URL = 'https://vvrexwgovtnjdcdlwciw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmV4d2dvdnRuamRjZGx3Y2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTcyODUsImV4cCI6MjA3OTEzMzI4NX0.RqJXqlwnQggkeMAhd6FRcb4ofxZ3xqDn-KYQ-TScf1s';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPABASE_BUCKET = 'Vwin';



const HomePage = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'veo2' | 'veo3' | 'veo3+' | 'sora2' | 'sora2-text'>('veo2');
  // 模块选择状态
  const [currentModule, setCurrentModule] = useState<'veo' | 'sora' | 'nano'>('veo');

  // 模型选择状态
  const [selectedModel, setSelectedModel] = useState<string>('veo2');

  // Nano Banana states
  const [nanoModel, setNanoModel] = useState('nano-banana-2');
  const [nanoImageSize, setNanoImageSize] = useState('1K');
  const [nanoImages, setNanoImages] = useState<string[]>([]);

  // 表单状态
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState<number>(10);
  const [size, setSize] = useState<string>('small');
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [uploading3, setUploading3] = useState(false);
  const [uploadingNano, setUploadingNano] = useState(false);
  const [uploadingSora, setUploadingSora] = useState(false);
  const [soraUrl, setSoraUrl] = useState(''); // Sora 专用 URL
  // Sora2 文生视频表单状态（精简：仅保留必要字段）
  const [soraTextModel, setSoraTextModel] = useState<'sora-2'>('sora-2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingActiveRef = useRef<boolean>(false);
  const generatingModelRef = useRef<string>(''); // 用于记录当前正在生成的模型名称，以便在结果中展示
  // 防重复提交：最近一次请求的幂等键与时间戳
  const lastReqKeyRef = useRef<string>('');
  const lastReqAtRef = useRef<number>(0);

  // 页面持久化：加载本地缓存的结果与任务队列（避免切换或刷新后丢失）
  useEffect(() => {
    try {
      const cachedResult = localStorage.getItem('vwin_last_generation_result');
      const cachedJobs = localStorage.getItem('vwin_jobs');
      if (cachedResult) {
        setGenerationResult(JSON.parse(cachedResult));
      }
      if (cachedJobs) {
        const parsed = JSON.parse(cachedJobs);
        if (Array.isArray(parsed)) setJobs(parsed);
      }
    } catch (e) {
      console.warn('Load cache failed', e);
    }
  }, []);

  // 当结果变化时，写入本地缓存（避免依赖未声明的 jobs）
  useEffect(() => {
    try {
      if (generationResult) {
        localStorage.setItem('vwin_last_generation_result', JSON.stringify(generationResult));
      }
    } catch (e) {
      console.warn('Save cache failed', e);
    }
  }, [generationResult]);

  // 并行异步队列（用于 Veo / Sora；同时也承载 Nano 的历史与运行中占位）
  type Job = {
    id: string; // 本地队列ID
    taskId?: string; // 远端任务ID
    model: 'veo2' | 'veo2-fast-frames' | 'veo3' | 'veo3-fast' | 'veo3-frames' | 'veo3-pro' | 'veo3-pro-frames' | 'veo3.1-components' | 'veo3.1' | 'veo3.1-pro' | 'sora2' | 'sora2-text' | 'nano-banana' | 'nano-banana-2';
    module?: 'veo' | 'sora' | 'nano'; // 所属模块
    prompt: string;
    aspect_ratio: string;
    images?: string[];
    // Sora 专用参数
    sora_url?: string;
    duration?: number;
    size?: string;
    status: 'queued' | 'submitting' | 'running' | 'succeeded' | 'failed';
    createdAt: number;
    result?: { video_url?: string; image_url?: string; raw?: any };
    error?: string;
  };

  const [jobs, setJobs] = useState<Job[]>([]);
  const MAX_PARALLEL = 3;
  // 后端已提供统一接口：生成 /api/generate/video，查询 /api/tasks/{task_id}
  // 服务端会根据 model 自动路由（veo2/veo3），前端无需区分

  // 仅在“正在发起请求”阶段锁定按钮；拿到 taskId 或加入队列后即解锁
  const isSubmitting = isGenerating && !taskId;

  // 当队列变化时，写入本地缓存
  useEffect(() => {
    try {
      localStorage.setItem('vwin_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.warn('Save jobs cache failed', e);
    }
  }, [jobs]);

  // 轮询所有运行中的任务（每3秒）
  useEffect(() => {
    const interval = setInterval(async () => {
      // 支持 Veo/Sora 模块的队列轮询
      const running = jobs.filter(j => j.status === 'running' && j.taskId);
      if (running.length === 0) return;
      const token = localStorage.getItem('access_token');
      // 逐个查询状态
      const updates: Record<string, Partial<Job>> = {};
      for (const job of running) {
        try {
          let res: Response;
          if (job.module === 'sora') {
            // Sora 查询接口：区分图（sora2）与文生视频（sora2-text）
            const url = (job.model === 'sora2-text')
              ? `${API_BASE}/api/proxy/sora-text/result/${job.taskId}`
              : `${API_BASE}/api/proxy/sora/result/${job.taskId}`;
            res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          } else {
            // Veo 查询接口
            res = await fetch(`${API_BASE}/api/tasks/${job.taskId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          if (!res.ok) continue;
          const data = await res.json();
          // 兼容更多状态：SUCCESS/success/succeeded/completed
          const statusRaw = (data.status || data.data?.status || '').toString().toLowerCase();
          if (['succeeded', 'success', 'completed'].includes(statusRaw)) {
            // 优先从 data.output 读取（字符串直链）
            const output = typeof data.data?.output === 'string' ? data.data.output : undefined;
            const videoUrl = output || data.video_url || data.data?.video_url || data.output?.video_url || data.result?.video_url;
            const imageUrl = data.url || data.data?.url || data.output?.url || data.result?.url;
            updates[job.id] = {
              status: 'succeeded',
              result: { video_url: videoUrl, image_url: imageUrl, raw: data }
            };
            // 保存到 Supabase
            const record = {
              model: job.model,
              prompt: job.prompt,
              images: job.images || [],
              aspect_ratio: job.aspect_ratio,
              created_at: new Date(job.createdAt).toISOString(),
              video_url: videoUrl || null,
              image_url: imageUrl || null
            };
            try {
              await supabase.from('generations').insert(record);
            } catch (e) {
              console.warn('Supabase insert failed', e);
            }
          } else if (['failed', 'error'].includes(statusRaw) || data.error) {
            const failText = data.error?.message || data.error || '未知错误';
            updates[job.id] = { status: 'failed', error: failText };
            // 弹出错误提醒
            setSnackbarMsg('生成失败: ' + failText);
            setSnackbarOpen(true);
          }
        } catch (e: any) {
          console.error('poll error', e);
        }
      }
      if (Object.keys(updates).length) {
        setJobs(prev => {
          const merged = prev.map(j => updates[j.id] ? { ...j, ...updates[j.id] } : j);
          // 对 Sora2（无水印）失败的任务，直接取消 UI（不在列表展示）
          return merged.filter(j => !(j.module === 'sora' && j.status === 'failed'));
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs, currentModule]);

  // 提交队列中的任务（最多并行3）
  useEffect(() => {
    const submitNext = async () => {
      // 支持当前模块的队列提交（veo/sora）
      const running = jobs.filter(j => j.status === 'running').length;
      const capacity = MAX_PARALLEL - running;
      if (capacity <= 0) return;
      const toSubmit = jobs.filter(j => j.status === 'queued').slice(0, capacity);
      if (toSubmit.length === 0) return;

      const token = localStorage.getItem('access_token');
      for (const job of toSubmit) {
        // 标记为提交中
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'submitting' } : j));
        try {
          let res: Response;
          if (job.module === 'sora') {
            // Sora 提交：区分图（sora2）与文生视频（sora2-text）
            let endpoint = '';
            let payload: any = {};
            if (job.model === 'sora2-text') {
              endpoint = '/api/proxy/sora-text/generate';
              payload = {
                prompt: job.prompt,
                aspectRatio: job.aspect_ratio,
                duration: job.duration || 10,
                size: job.size || 'small'
              };
            } else {
              endpoint = '/api/proxy/sora/generate';
              payload = {
                prompt: job.prompt,
                aspectRatio: job.aspect_ratio,
                duration: job.duration || 10,
                size: job.size || 'small',
                url: job.sora_url || undefined
              };
            }
            res = await fetch(`${API_BASE}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
          } else {
            const endpoint = '/api/generate/video';
            const payload: any = {
              prompt: job.prompt,
              model: job.model,
              aspect_ratio: job.aspect_ratio,
              enhance_prompt: true,
              enable_upsample: true,
              images: job.images && job.images.length ? job.images : undefined
            };
            res = await fetch(`${API_BASE}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });
          }
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || '请求失败');
          }
          const data = await res.json();
          const task_id = data.task_id;
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'running', taskId: task_id } : j));
        } catch (e: any) {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'failed', error: e.message } : j));
        }
      }
    };
    submitNext();
  }, [jobs, currentModule]);

  const { user, loading, logout } = useAuth();
  
  // 调试：打印用户信息
  useEffect(() => {
    console.log('=== 用户信息调试 ===');
    console.log('Loading 状态:', loading);
    console.log('User object:', user);
    console.log('Username:', user?.username);
    console.log('Email:', user?.email);
    console.log('Token:', localStorage.getItem('access_token') ? '存在' : '不存在');
    console.log('==================');
  }, [user, loading]);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // 仅当没有 token 时跳转登录；有 token 即使暂时拉不到用户，也允许进入页面
    if (!token) {
      navigate('/login');
      return;
    }
    // 保留页面，等待 AuthProvider 完成鉴权；不要因 user 为空而重定向
  }, [navigate]);

  // 轮询任务状态
  useEffect(() => {
    // 安全兜底：一旦拿到 taskId，就立即释放按钮 loading，避免按钮被占用
    // 轮询继续在后台进行
    if (taskId) {
      setIsGenerating(false);
    }

    if (taskId) {
      const checkStatus = async () => {
        try {
          const token = localStorage.getItem('access_token');
          // 根据当前模块选择不同的查询接口
          // Nano 模块不需要轮询，直接返回结果，所以这里不需要处理 nano
          const statusUrl = currentModule === 'sora'
            ? (activeTab === 'sora2-text'
                ? `${API_BASE}/api/proxy/sora-text/result/${taskId}`
                : `${API_BASE}/api/proxy/sora/result/${taskId}`)
            : `${API_BASE}/api/tasks/${taskId}`;

          const res = await fetch(statusUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // 统一归一化状态大小写
            const statusRaw = (data.status || data.data?.status || '').toString().toLowerCase();
            if (['succeeded', 'success', 'completed'].includes(statusRaw)) {
              // 立即停止当前轮询，避免在依赖变化清理前继续触发一次
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              pollingActiveRef.current = false;
              // 注入模型名称
              const resultWithModel = { ...data, _model: generatingModelRef.current };
              setGenerationResult(resultWithModel);
              setIsGenerating(false);
              setTaskId(null);
              setSnackbarMsg('视频生成成功！');
              setSnackbarOpen(true);
            } else if (['failed', 'failure', 'error'].includes(statusRaw) || data.error || data.fail_reason) {
              // 立即停止当前轮询
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              pollingActiveRef.current = false;
              setIsGenerating(false);
              setTaskId(null);
              const failMsg = (() => {
                if (typeof data.error === 'string') return data.error;
                if (data.error?.message) return data.error.message;
                if (typeof data.fail_reason === 'string' && data.fail_reason) {
                  try {
                    const fr = JSON.parse(data.fail_reason);
                    if (fr?.message) return fr.message;
                  } catch {}
                  return data.fail_reason;
                }
                return '未知错误';
              })();
              setSnackbarMsg('视频生成失败: ' + failMsg);
              setSnackbarOpen(true);
            }
            // 如果是 processing 或 pending，继续轮询
          }
        } catch (error) {
          console.error("Poll error", error);
        }
      };

      // 启动新轮询前，确保旧的已清理；避免重复定时器
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (!pollingActiveRef.current) {
        pollTimerRef.current = setInterval(checkStatus, 3000); // 每3秒轮询一次
        pollingActiveRef.current = true;
      }
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollingActiveRef.current = false;
    };
  }, [taskId, currentModule]);

  // 切换标签页时重置模型
  useEffect(() => {
    if (currentModule === 'sora' || currentModule === 'nano') {
      return;
    }
    if (activeTab === 'veo2') {
      setSelectedModel('veo2');
    } else if (activeTab === 'veo3') {
      setSelectedModel('veo3');
    } else if (activeTab === 'veo3+') {
      setSelectedModel('veo3-pro');
    }
  }, [activeTab, currentModule]);

  // 当切换模型时，清空图片，避免误传
  useEffect(() => {
    setImage1('');
    setImage2('');
    setImage3('');
    // setNanoImages([]); // 切换模型时不清除 Nano 图片
  }, [selectedModel, currentModule]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    logout();
    navigate('/');
  };

  const handleMenu = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setSnackbarMsg('请输入提示词');
      setSnackbarOpen(true);
      return;
    }
    // 统一构造幂等键（按模块+模型+提示词+主要参数）
    const mkKey = (obj: any) => {
      try {
        const s = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash) + s.charCodeAt(i);
        return `${obj.module || currentModule}:${obj.model || selectedModel}:${hash}`;
      } catch { return `${currentModule}:${selectedModel}:${prompt.slice(0,32)}`; }
    };
    // Veo 模块：改为异步队列（允许多次提交，并行上限3）
    // 支持 veo2 与 veo3 / veo3+ 系列（统一走后端 /api/generate/video；后端按 model 路由）
    const queueModels = [
      'veo2', 'veo2-fast-frames',
      'veo3', 'veo3-fast', 'veo3-frames',
      'veo3-pro', 'veo3-pro-frames',
      'veo3.1-components', 'veo3.1', 'veo3.1-pro'
    ];
    if (currentModule === 'veo' && queueModels.includes(selectedModel)) {
      const images: string[] = [];
      if (image1) images.push(image1);
      if (image2) images.push(image2);
      if (image3) images.push(image3);
      const reqKey = mkKey({ module: 'veo', model: selectedModel, prompt, aspectRatio, images });
      const now = Date.now();
      if (lastReqKeyRef.current === reqKey && (now - lastReqAtRef.current) < 5000) {
        setSnackbarMsg('短时间内重复提交，已忽略');
        setSnackbarOpen(true);
        return;
      }
      lastReqKeyRef.current = reqKey; lastReqAtRef.current = now;
      const id = Math.random().toString(36).slice(2);
      const newJob: Job = {
        id,
        module: 'veo',
        model: selectedModel as Job['model'],
        prompt,
        aspect_ratio: aspectRatio,
        images: images.length ? images : undefined,
        status: 'queued',
        createdAt: Date.now()
      };
      setJobs(prev => [newJob, ...prev]);
      setSnackbarMsg('任务已加入队列');
  setSnackbarOpen(true);
  // 队列提交成功后，不阻塞按钮，允许继续发起其他请求
  setIsGenerating(false);
      return;
    }

    // 其他模块保持原逻辑
    // 若已在生成，避免再次触发
    if (isGenerating) {
      setSnackbarMsg('正在生成中，请稍候…');
      setSnackbarOpen(true);
      return;
    }
    setIsGenerating(true);
    setGenerationResult(null);
    setTaskId(null);

    const token = localStorage.getItem('access_token');
    let endpoint = '';
    let payload: any = {};

    // 记录当前模型名称
    const currentModelName = currentModule === 'sora'
      ? (activeTab === 'sora2' ? 'sora图' : 'sora2文')
      : (currentModule === 'nano' ? nanoModel : selectedModel);
    generatingModelRef.current = currentModelName;

    if (currentModule === 'sora' && activeTab === 'sora2') {
      // 走异步队列：Sora2 无水印（参考图）
      const id = Math.random().toString(36).slice(2);
      const reqKey = mkKey({ module: 'sora', model: 'sora2', prompt, aspectRatio, duration, size, url: soraUrl });
      const now = Date.now();
      if (lastReqKeyRef.current === reqKey && (now - lastReqAtRef.current) < 5000) {
        setSnackbarMsg('短时间内重复提交，已忽略');
        setSnackbarOpen(true);
        setIsGenerating(false);
        return;
      }
      lastReqKeyRef.current = reqKey; lastReqAtRef.current = now;
      const newJob: Job = {
        id,
        module: 'sora',
        model: 'sora2' as any,
        prompt,
        aspect_ratio: aspectRatio,
        sora_url: soraUrl || undefined,
        duration,
        size,
        status: 'queued',
        createdAt: Date.now()
      };
      setJobs(prev => [newJob, ...prev]);
      setSnackbarMsg('任务已加入队列');
      setSnackbarOpen(true);
      // 队列提交成功后，释放按钮占用；后续由任务卡片 + 轮询驱动
      setIsGenerating(false);
      return;
    } else if (currentModule === 'sora' && activeTab === 'sora2-text') {
      // 改为队列模式：允许并行最多3个，统一由 submitNext 异步提交
      const reqKey = mkKey({ module: 'sora', model: 'sora2-text', prompt, aspectRatio, duration, size });
      const now = Date.now();
      if (lastReqKeyRef.current === reqKey && (now - lastReqAtRef.current) < 5000) {
        setSnackbarMsg('短时间内重复提交，已忽略');
        setSnackbarOpen(true);
        setIsGenerating(false);
        return;
      }
      lastReqKeyRef.current = reqKey; lastReqAtRef.current = now;
      const id = Math.random().toString(36).slice(2);
      const newJob: Job = {
        id,
        module: 'sora',
        model: 'sora2-text' as any,
        prompt,
        aspect_ratio: aspectRatio,
        duration,
        size,
        status: 'queued',
        createdAt: Date.now()
      };
      setJobs(prev => [newJob, ...prev]);
      setSnackbarMsg('任务已加入队列');
      setSnackbarOpen(true);
      setIsGenerating(false);
      return;
    } else if (currentModule === 'nano') {
      endpoint = '/api/proxy/nano/generate';
      payload = {
        model: nanoModel,
        prompt,
        aspect_ratio: aspectRatio,
        image_size: nanoModel === 'nano-banana-2' ? nanoImageSize : undefined,
        images: nanoImages.length > 0 ? nanoImages : undefined
      };
      // Nano 直接返回结果，也做幂等检查
      const reqKey = mkKey({ module: 'nano', model: nanoModel, prompt, aspectRatio, image_size: nanoImageSize, images: nanoImages });
      const now = Date.now();
      if (lastReqKeyRef.current === reqKey && (now - lastReqAtRef.current) < 5000) {
        setSnackbarMsg('短时间内重复提交，已忽略');
        setSnackbarOpen(true);
        setIsGenerating(false);
        return;
      }
      lastReqKeyRef.current = reqKey; lastReqAtRef.current = now;
      // 为 Nano 也插入一个“运行中”占位任务到历史列表中，便于在任何模块下可见
      const nanoPendingId = Math.random().toString(36).slice(2);
      const nanoPendingJob: Job = {
        id: nanoPendingId,
        module: 'nano',
        model: nanoModel as Job['model'],
        prompt,
        aspect_ratio: aspectRatio,
        images: nanoImages.length ? nanoImages : undefined,
        status: 'running',
        createdAt: Date.now()
      };
      setJobs(prev => [nanoPendingJob, ...prev]);
      // 把占位ID临时挂到 payload 上，供后续成功/失败时更新（局部变量在 try/catch 中也可访问）
      (payload as any)._nanoPendingId = nanoPendingId;
    } else {
      endpoint = '/api/generate/video';

      const images = [];
      if (image1) images.push(image1);
      if (image2) images.push(image2);
      if (image3) images.push(image3);

      payload = {
        prompt,
        model: selectedModel,
        aspect_ratio: aspectRatio,
        enhance_prompt: true,
        enable_upsample: true,
        images: images.length > 0 ? images : undefined
      };
      const reqKey = mkKey({ module: 'veo', model: selectedModel, prompt, aspectRatio, images });
      const now = Date.now();
      if (lastReqKeyRef.current === reqKey && (now - lastReqAtRef.current) < 5000) {
        setSnackbarMsg('短时间内重复提交，已忽略');
        setSnackbarOpen(true);
        setIsGenerating(false);
        return;
      }
      lastReqKeyRef.current = reqKey; lastReqAtRef.current = now;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '请求失败');
      }

      const data = await res.json();

      if (currentModule === 'nano') {
        // Nano 直接返回结果，同时把历史“运行中”占位替换为成功卡片（可能返回多张）
        const resultWithModel = { ...data, _model: currentModelName } as any;
        const pendingId = (payload as any)._nanoPendingId as string | undefined;
        // 规范化为数组 URL 列表
        let urls: string[] = [];
        if (Array.isArray(resultWithModel?.data)) {
          urls = resultWithModel.data.map((it: any) => it?.url || it?.image_url || it).filter(Boolean);
        } else {
          const u = resultWithModel?.data?.url || resultWithModel?.image_url || resultWithModel?.url;
          if (u) urls = [u];
        }
        // 去重
        const seen = new Set<string>();
        urls = urls.filter(u => { const k = String(u); if (seen.has(k)) return false; seen.add(k); return true; });

        setJobs(prev => {
          // 删除占位卡
          const withoutPending = pendingId ? prev.filter(j => j.id !== pendingId) : prev.slice();
          // 追加成功卡（多图则拆分为多条）
          const successJobs: Job[] = urls.length ? urls.map(u => ({
            id: Math.random().toString(36).slice(2),
            module: 'nano',
            model: nanoModel as Job['model'],
            prompt,
            aspect_ratio: aspectRatio,
            status: 'succeeded',
            createdAt: Date.now(),
            result: { image_url: u, raw: resultWithModel }
          })) : pendingId ? [{
            id: pendingId,
            module: 'nano',
            model: nanoModel as Job['model'],
            prompt,
            aspect_ratio: aspectRatio,
            status: 'succeeded',
            createdAt: Date.now(),
            result: { raw: resultWithModel }
          } as Job] : [];
          return [...successJobs, ...withoutPending];
        });

        setGenerationResult(resultWithModel);
        setIsGenerating(false);
        setSnackbarMsg('图片生成成功！');
        setSnackbarOpen(true);
      } else {
  setTaskId(data.task_id);
  // 已拿到任务ID，改为异步轮询，不再占用按钮的“生成中”状态
  setIsGenerating(false);
        setSnackbarMsg('任务已提交，正在生成中...');
        setSnackbarOpen(true);
      }

    } catch (error: any) {
      setIsGenerating(false);
      // 统一对用户的异常说明（含 Nano 接口异常的文案）
      const msg = (currentModule === 'nano')
        ? `Nano API 请求异常：${error?.message || '请稍后重试'}`
        : (error?.message || '请求失败');
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
      // Nano 失败：直接移除“运行中”占位卡片，不在历史区保留失败卡；同时无需轮询
      if (currentModule === 'nano') {
        const pendingId = (payload as any)?._nanoPendingId as string | undefined;
        if (pendingId) {
          setJobs(prev => prev.filter(j => j.id !== pendingId));
        }
      }
    } finally {
      // 双保险：任何情况下都解除按钮占用；对于需要轮询的任务，taskId 控制显示卡片即可
      setIsGenerating(false);
    }
  };

  // 上传到 Supabase 并返回公开 URL
  const uploadToSupabase = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const path = `op/${id}.${ext}`;
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw new Error(`上传失败：${error.message}`);
    const { data: pub } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path);
    return pub.publicUrl;
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} sx={{ bgcolor: 'background.default' }}>
          <CircularProgress color="primary" />
          <Typography variant="body2" color="text.secondary">正在加载数据...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100vh',
        // 弥散光感背景 - 调优版：更清爽、更白净
        bgcolor: '#f8fafc',
        background: `
          radial-gradient(circle at 15% 15%, rgba(219, 234, 254, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%), /* 右侧调白 */
          radial-gradient(circle at 50% 0%, rgba(239, 246, 255, 0.5) 0%, transparent 60%),
          linear-gradient(to bottom, #f0f9ff 0%, #f8fafc 100%)
        `,
        // 叠加微妙噪点纹理增加质感
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(219, 234, 254, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%), /* 右侧调白 */
          radial-gradient(circle at 50% 0%, rgba(239, 246, 255, 0.5) 0%, transparent 60%),
          linear-gradient(to bottom, #f0f9ff 0%, #f8fafc 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, cover',
        position: 'relative',
        pb: 4,
        // 添加微妙的内阴影,增强深度
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(to bottom, rgba(239, 246, 255, 0.3) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}>
        {/* 1. 顶部导航栏 */}
      <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#eff6ff',

            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #bfdbfe',
            position: 'relative',
                        overflow: 'hidden',
            zIndex: 1,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '-5%', // 稍微放大以容纳动画移动
              zIndex: 0,
              pointerEvents: 'none',
              // 强烈的波浪纹理：多层波浪，蓝白相间，波浪夹白
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%233b82f6' fill-opacity='0.15' d='M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,181.3C672,181,768,203,864,224C960,245,1056,267,1152,250.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3Cpath fill='%2360a5fa' fill-opacity='0.3' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3Cpath fill='%23ffffff' fill-opacity='0.6' d='M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,245.3C672,256,768,256,864,245.3C960,235,1056,213,1152,208C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'waveMove 20s ease-in-out infinite alternate'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              transform: 'skewX(-20deg)',
              animation: 'shimmer 8s infinite linear',
              pointerEvents: 'none',
              zIndex: 0
            }

          }}
        >
          <Toolbar sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1e293b', fontWeight: 700 }}>
              Vwin
            </Typography>

            <Box display="flex" alignItems="center" gap={2}>
              <Button 
                onClick={() => navigate('/pricing')}
                sx={{ 
                  color: '#ffffff', 
                  fontWeight: 600,
                  mr: 2,
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  transition: 'all 0.3s',
                  '&:hover': { 
                    bgcolor: 'transparent',
                    transform: 'scale(1.2)',
                    textShadow: '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)',
                  }
                }}
              >
                会员套餐
              </Button>

              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                onMouseEnter={handleMenu}
                sx={{ position: 'relative' }}
              >
                <Box sx={{ p: 0, cursor: 'pointer' }}>
                  <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32, fontSize: '0.9rem' }}>
                    {loading ? '...' : (user?.username ? user.username.charAt(0).toUpperCase() : 'U')}
                  </Avatar>
                </Box>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  MenuListProps={{
                    onMouseLeave: handleClose,
                  }}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                      mt: 0.5,
                      borderRadius: 0.5,
                      minWidth: 140,
                      bgcolor: 'white',
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.2 }}>
                    <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 700, mb: 0.3, fontSize: '0.95rem' }}>
                      {loading ? '加载中...' : (user?.username || '未登录用户')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}>
                      {loading ? '...' : (user?.email || '未绑定邮箱')}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 0 }} />

                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      bgcolor: '#f8fafc',
                      px: 1.5,
                      py: 0.8,
                      borderRadius: 1.5,
                      border: '1px solid #f1f5f9'
                    }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>积分</Typography>
                      <Typography sx={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 800 }}>{user?.points || 0}</Typography>
                    </Box>
                  </Box>
                  
                  <MenuItem onClick={() => { handleClose(); navigate('/profile'); }} sx={{ py: 0.8, px: 2, fontSize: '0.75rem', minHeight: 'auto' }}>
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>个人中心（积分购买）</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ py: 0.8, px: 2, fontSize: '0.75rem', minHeight: 'auto' }}>
                    <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500, fontSize: '0.75rem' }}>退出登录</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{
          mt: 4,
          width: { xs: '95%', sm: '92%', md: '90%', lg: '88%', xl: '85%' },
          maxWidth: '1920px',
          mx: 'auto',
          px: { xs: 1, sm: 2, md: 3 },
          position: 'relative',
          zIndex: 1
        }}>
          <ThreeDCarousel />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 3, alignItems: 'stretch' }}>
            {/* 左侧：模型选择栏 */}
            <Paper elevation={0} sx={{ ...cardBase, p: 0, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" fontWeight={700}>模型选择</Typography>
                <Typography variant="caption" color="text.secondary">选择视频生成模型</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <List component="nav" sx={{ py: 1 }}>
                  <ListItemButton
                    selected={currentModule === 'veo'}
                    onClick={() => {
                      setCurrentModule('veo');
                      setActiveTab('veo2');
                    }}
                    sx={{
                      mb: 1, mx: 1, borderRadius: 1,
                      bgcolor: currentModule === 'veo' ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      color: currentModule === 'veo' ? 'primary.main' : 'inherit',
                      '&.Mui-selected': { 
                        bgcolor: 'rgba(37, 99, 235, 0.12)',
                        '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.12)' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: currentModule === 'veo' ? 'primary.main' : 'inherit' }}>
                      <MovieCreationIcon />
                    </ListItemIcon>
                    <ListItemText primary="Veo" secondary="适合通用视频生成" />
                  </ListItemButton>

                  <ListItemButton
                    selected={currentModule === 'sora'}
                    onClick={() => {
                      setCurrentModule('sora');
                      setActiveTab('sora2');
                    }}
                    sx={{
                      mb: 1, mx: 1, borderRadius: 1,
                      bgcolor: currentModule === 'sora' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      color: currentModule === 'sora' ? 'secondary.main' : 'inherit',
                      '&.Mui-selected': { 
                        bgcolor: 'rgba(16, 185, 129, 0.12)',
                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.12)' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: currentModule === 'sora' ? 'secondary.main' : 'inherit' }}>
                      <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sora" secondary="Sora2 无水印生成" />
                  </ListItemButton>

                  <ListItemButton
                    selected={currentModule === 'nano'}
                    onClick={() => setCurrentModule('nano')}
                    sx={{
                      mb: 1, mx: 1, borderRadius: 1,
                      bgcolor: currentModule === 'nano' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      color: currentModule === 'nano' ? '#f59e0b' : 'inherit',
                      '&.Mui-selected': { 
                        bgcolor: 'rgba(245, 158, 11, 0.12)',
                        '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.12)' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: currentModule === 'nano' ? '#f59e0b' : 'inherit' }}>
                      <PhotoLibraryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Nano Banana" secondary="AI 图片生成" />
                  </ListItemButton>
                </List>
              </Box>
            </Paper>

            {/* 右侧：工作区（标题与分隔线全宽，结果区域从线下方开始） */}
            <Paper elevation={0} sx={{ ...cardBase, minHeight: 560, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {currentModule === 'veo' ? (
                  <>
                    {/* Veo2 Tab */}
                    <Box
                      onClick={() => setActiveTab('veo2')}
                      sx={{
                        position: 'relative',
                        bgcolor: activeTab === 'veo2' ? '#2563eb' : '#e2e8f0',
                        color: activeTab === 'veo2' ? 'white' : '#64748b',
                        pl: 3,
                        pr: 3,
                        py: 0.75,
                        width: 'fit-content',
                        cursor: 'pointer',
                        clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&::after': activeTab === 'veo2' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          bgcolor: 'rgba(255, 255, 255, 0.4)',
                          transform: 'skewX(-20deg)',
                          animation: `${shine} 1.5s infinite linear`
                        } : {}
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        veo2
                      </Typography>
                    </Box>

                    {/* Veo3 Tab */}
                    <Box
                      onClick={() => setActiveTab('veo3')}
                      sx={{
                        position: 'relative',
                        bgcolor: activeTab === 'veo3' ? '#f59e0b' : '#e2e8f0',
                        color: activeTab === 'veo3' ? 'white' : '#64748b',
                        pl: 3,
                        pr: 3,
                        py: 0.75,
                        width: 'fit-content',
                        cursor: 'pointer',
                        clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&::after': activeTab === 'veo3' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          bgcolor: 'rgba(255, 255, 255, 0.4)',
                          transform: 'skewX(-20deg)',
                          animation: `${shine} 1.5s infinite linear`
                        } : {}
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        veo3
                      </Typography>
                    </Box>

                    {/* Veo3+ Tab */}
                    <Box
                      onClick={() => setActiveTab('veo3+')}
                      sx={{
                        position: 'relative',
                        bgcolor: activeTab === 'veo3+' ? '#10b981' : '#e2e8f0',
                        color: activeTab === 'veo3+' ? 'white' : '#64748b',
                        pl: 3,
                        pr: 3,
                        py: 0.75,
                        width: 'fit-content',
                        cursor: 'pointer',
                        clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&::after': activeTab === 'veo3+' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          bgcolor: 'rgba(255, 255, 255, 0.4)',
                          transform: 'skewX(-20deg)',
                          animation: `${shine} 1.5s infinite linear`
                        } : {}
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>
                        veo3+
                      </Typography>
                    </Box>
                  </>
                ) : currentModule === 'sora' ? (
                  /* Sora Tabs */
                  <>
                    <Box
                      onClick={() => setActiveTab('sora2')}
                      sx={{
                        position: 'relative',
                        bgcolor: activeTab === 'sora2' ? '#10b981' : '#e2e8f0',
                        color: activeTab === 'sora2' ? 'white' : '#64748b',
                        pl: 3,
                        pr: 6,
                        py: 0.75,
                        width: 'fit-content',
                        cursor: 'pointer',
                        clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&::after': activeTab === 'sora2' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          bgcolor: 'rgba(255, 255, 255, 0.4)',
                          transform: 'skewX(-20deg)',
                          animation: `${shine} 1.5s infinite linear`
                        } : {}
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Sora2
                        </Typography>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -4,
                            left: '100%',
                            ml: -0.5,
                            fontSize: '10px',
                            border: '1px solid white',
                            borderRadius: '10px',
                            px: 0.5,
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            transform: 'scale(0.9)',
                            transformOrigin: 'left center'
                          }}
                        >
                          无水印
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      onClick={() => setActiveTab('sora2-text')}
                      sx={{
                        position: 'relative',
                        bgcolor: activeTab === 'sora2-text' ? '#8b5cf6' : '#e2e8f0',
                        color: activeTab === 'sora2-text' ? 'white' : '#64748b',
                        pl: 3,
                        pr: 3,
                        py: 0.75,
                        width: 'fit-content',
                        cursor: 'pointer',
                        clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&::after': activeTab === 'sora2-text' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '6px',
                          bgcolor: 'rgba(255, 255, 255, 0.4)',
                          transform: 'skewX(-20deg)',
                          animation: `${shine} 1.5s infinite linear`
                        } : {}
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={700}>sora2文生视频</Typography>
                    </Box>
                  </>
                ) : (
                  /* Nano Tab */
                  <Box
                    sx={{
                      position: 'relative',
                      bgcolor: '#f59e0b',
                      color: 'white',
                      pl: 3,
                      pr: 3,
                      py: 0.75,
                      width: 'fit-content',
                      clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '6px',
                        bgcolor: 'rgba(255, 255, 255, 0.4)',
                        transform: 'skewX(-20deg)',
                        animation: `${shine} 1.5s infinite linear`
                      }
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Nano Banana
                    </Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, flex: 1, mt: 1 }}>
                {/* 左侧配置区域 */}
                <Box sx={{ flex: { xs: '1 1 auto', lg: '0 0 35%' }, display: 'flex', flexDirection: 'column', minHeight: 600 }}>
                  <Box component="form" noValidate autoComplete="off" display="flex" flexDirection="column" gap={3} sx={{ flex: 1 }}>
                    <TextField
                      label="Prompt (提示词)"
                      multiline
                      rows={4}
                      placeholder="Describe the image you want to create..."
                      fullWidth
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      variant="outlined"
                      sx={{ bgcolor: '#f8fafc' }}
                    />

                    {currentModule === 'veo' ? (
                      /* Veo 表单字段 */
                      <>
                        {/* 仅当模型支持图片输入时显示 (veo2-fast-frames 或 veo3 系列 或 veo3+ 系列) */}
                        {(selectedModel === 'veo2-fast-frames' || selectedModel.startsWith('veo3')) && (
                          <>
                            {/* 上传框并行显示：首帧、尾帧、中间帧 */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {/* 本地上传：首帧 Image 1 */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 110 }}>
                                <Typography variant="caption" color="text.secondary">参考图1</Typography>
                                <Button
                                  variant="outlined"
                                  component="label"
                                  disabled={uploading1}
                                  sx={{
                                    width: '100%',
                                    aspectRatio: '1/1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: 2,
                                    color: 'text.secondary',
                                    overflow: 'hidden',
                                    p: 0,
                                    '&:hover': {
                                      border: '2px dashed #2563eb',
                                      bgcolor: 'rgba(37, 99, 235, 0.04)'
                                    }
                                  }}
                                >
                                  {image1 ? (
                                    <Box
                                      component="img"
                                      src={image1}
                                      alt="首帧预览"
                                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <>
                                      {uploading1 ? (
                                        <CircularProgress size={24} />
                                      ) : (
                                        <AddPhotoAlternateIcon sx={{ fontSize: 32, mb: 0.5, color: '#cbd5e1' }} />
                                      )}
                                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {uploading1 ? '上传中...' : '上传图片'}
                                      </Typography>
                                    </>
                                  )}
                                  <input type="file" accept="image/*" hidden onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploading1(true);
                                    try {
                                      const url = await uploadToSupabase(file);
                                      setImage1(url);
                                      setSnackbarMsg('首帧图片上传成功');
                                      setSnackbarOpen(true);
                                    } catch (err: any) {
                                      setSnackbarMsg(err.message || '首帧上传失败');
                                      setSnackbarOpen(true);
                                    } finally {
                                      setUploading1(false);
                                      e.target.value = '';
                                    }
                                  }} />
                                </Button>
                              </Box>

                              {/* 本地上传：尾帧 Image 2 */}
                              {selectedModel !== 'veo3-pro-frames' && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 110 }}>
                                  <Typography variant="caption" color="text.secondary">参考图2</Typography>
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={uploading2}
                                    sx={{
                                      width: '100%',
                                      aspectRatio: '1/1',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px dashed #e2e8f0',
                                      borderRadius: 2,
                                      color: 'text.secondary',
                                      overflow: 'hidden',
                                      p: 0,
                                      '&:hover': {
                                        border: '2px dashed #2563eb',
                                        bgcolor: 'rgba(37, 99, 235, 0.04)'
                                      }
                                    }}
                                  >
                                    {image2 ? (
                                      <Box
                                        component="img"
                                        src={image2}
                                        alt="尾帧预览"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <>
                                        {uploading2 ? (
                                          <CircularProgress size={24} />
                                        ) : (
                                          <AddPhotoAlternateIcon sx={{ fontSize: 32, mb: 0.5, color: '#cbd5e1' }} />
                                        )}
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                          {uploading2 ? '上传中...' : '上传图片'}
                                        </Typography>
                                      </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploading2(true);
                                      try {
                                        const url = await uploadToSupabase(file);
                                        setImage2(url);
                                        setSnackbarMsg('尾帧图片上传成功');
                                        setSnackbarOpen(true);
                                      } catch (err: any) {
                                        setSnackbarMsg(err.message || '尾帧上传失败');
                                        setSnackbarOpen(true);
                                      } finally {
                                        setUploading2(false);
                                        e.target.value = '';
                                      }
                                    }} />
                                  </Button>
                                </Box>
                              )}

                              {/* 本地上传：中间帧 Image 3 */}
                              {selectedModel === 'veo3.1-components' && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 110 }}>
                                  <Typography variant="caption" color="text.secondary">参考图3</Typography>
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={uploading3}
                                    sx={{
                                      width: '100%',
                                      aspectRatio: '1/1',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px dashed #e2e8f0',
                                      borderRadius: 2,
                                      color: 'text.secondary',
                                      overflow: 'hidden',
                                      p: 0,
                                      '&:hover': {
                                        border: '2px dashed #2563eb',
                                        bgcolor: 'rgba(37, 99, 235, 0.04)'
                                      }
                                    }}
                                  >
                                    {image3 ? (
                                      <Box
                                        component="img"
                                        src={image3}
                                        alt="中间帧预览"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <>
                                        {uploading3 ? (
                                          <CircularProgress size={24} />
                                        ) : (
                                          <AddPhotoAlternateIcon sx={{ fontSize: 32, mb: 0.5, color: '#cbd5e1' }} />
                                        )}
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                          {uploading3 ? '上传中...' : '上传图片'}
                                        </Typography>
                                      </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploading3(true);
                                      try {
                                        const url = await uploadToSupabase(file);
                                        setImage3(url);
                                        setSnackbarMsg('中间帧图片上传成功');
                                        setSnackbarOpen(true);
                                      } catch (err: any) {
                                        setSnackbarMsg(err.message || '中间帧上传失败');
                                        setSnackbarOpen(true);
                                      } finally {
                                        setUploading3(false);
                                        e.target.value = '';
                                      }
                                    }} />
                                  </Button>
                                </Box>
                              )}
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                              {selectedModel === 'veo3-pro-frames'
                                ? '* 仅支持上传一张图片作为参考。'
                                : selectedModel === 'veo3.1-components'
                                  ? '* 支持上传最多三张图片作为参考。'
                                  : '* 只传一张图片作为首帧参考，传两张则分别为首帧和尾帧。（veo2-fast-frames 支持本地上传）'}
                            </Typography>
                          </>
                        )}

                        <Box display="flex" gap={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Aspect Ratio</InputLabel>
                            <Select
                              value={aspectRatio}
                              label="Aspect Ratio"
                              onChange={(e) => setAspectRatio(e.target.value)}
                            >
                              <MenuItem value="16:9">Cinema (16:9)</MenuItem>
                              <MenuItem value="9:16">Portrait (9:16)</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {/* 模型选择（右侧表单控制，不联动左侧） */}
                        <FormControl fullWidth size="small">
                          <InputLabel>Model</InputLabel>
                          <Select
                            value={selectedModel}
                            label="Model"
                            onChange={(e) => setSelectedModel(e.target.value)}
                          >
                            {activeTab === 'veo2' ? [
                              <MenuItem key="veo2" value="veo2">Veo2</MenuItem>,
                              <MenuItem key="veo2-fast-frames" value="veo2-fast-frames">Veo2 Fast Frames</MenuItem>
                            ] : activeTab === 'veo3' ? [
                              <MenuItem key="veo3" value="veo3">Veo3</MenuItem>,
                              <MenuItem key="veo3-fast" value="veo3-fast">Veo3 Fast</MenuItem>,
                              <MenuItem key="veo3-frames" value="veo3-frames">Veo3 Frames</MenuItem>
                            ] : [
                              <MenuItem key="veo3-pro" value="veo3-pro">Veo3 Pro (首尾帧)</MenuItem>,
                              <MenuItem key="veo3-pro-frames" value="veo3-pro-frames">Veo3 Pro Frames (单图)</MenuItem>,
                              <MenuItem key="veo3.1-components" value="veo3.1-components">Veo3.1 Components (三图)</MenuItem>,
                              <MenuItem key="veo3.1" value="veo3.1">Veo3.1 (首尾帧)</MenuItem>,
                              <MenuItem key="veo3.1-pro" value="veo3.1-pro">Veo3.1 Pro (首尾帧)</MenuItem>
                            ]}
                          </Select>
                        </FormControl>
                      </>
                    ) : currentModule === 'sora' ? (
                      /* Sora 表单字段 */
                      <>
                        {activeTab === 'sora2-text' ? (
                          // 文生视频字段
                          <>
                            <FormControl fullWidth size="small">
                              <InputLabel>Model</InputLabel>
                              <Select
                                value={soraTextModel}
                                label="Model"
                                onChange={(e) => setSoraTextModel(e.target.value as any)}
                              >
                                <MenuItem value="sora-2">sora-2</MenuItem>
                              </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                              <Grid size={6}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Aspect Ratio</InputLabel>
                                  <Select
                                    value={aspectRatio}
                                    label="Aspect Ratio"
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                  >
                                    <MenuItem value="16:9">16:9 横屏</MenuItem>
                                    <MenuItem value="9:16">9:16 竖屏</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid size={6}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Duration</InputLabel>
                                  <Select
                                    value={duration}
                                    label="Duration"
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                  >
                                    <MenuItem value={10}>10s</MenuItem>
                                    <MenuItem value={15}>15s</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                            </Grid>

                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                审查说明：
                                1）图片或生成结果中涉及真人/像真人的不允许；
                                2）提示词不得含暴力、色情、版权、活着的名人；
                                3）生成结果将进行多阶段审查（可能在 90% 后失败）。
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          // Sora2 无水印 - 参考图必填
                          <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Reference Image (参考图片 - 必填)</Typography>
                          <Box sx={{ width: 110, position: 'relative' }}>
                            <Button
                              variant="outlined"
                              component="label"
                              disabled={uploadingSora}
                              sx={{
                                width: '100%',
                                aspectRatio: '1/1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #e2e8f0',
                                borderRadius: 2,
                                color: 'text.secondary',
                                overflow: 'hidden',
                                p: 0,
                                '&:hover': {
                                  border: '2px dashed #10b981',
                                  bgcolor: 'rgba(16, 185, 129, 0.04)'
                                }
                              }}
                            >
                              {soraUrl ? (
                                <Box
                                  component="img"
                                  src={soraUrl}
                                  alt="参考图预览"
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <>
                                  {uploadingSora ? (
                                    <CircularProgress size={24} sx={{ color: '#10b981' }} />
                                  ) : (
                                    <AddPhotoAlternateIcon sx={{ fontSize: 32, mb: 0.5, color: '#cbd5e1' }} />
                                  )}
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    {uploadingSora ? '上传中...' : '上传图片'}
                                  </Typography>
                                </>
                              )}
                              <input type="file" accept="image/*" hidden onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingSora(true);
                                try {
                                  const url = await uploadToSupabase(file);
                                  setSoraUrl(url);
                                  setSnackbarMsg('参考图上传成功');
                                  setSnackbarOpen(true);
                                } catch (err: any) {
                                  setSnackbarMsg(err.message || '上传失败');
                                  setSnackbarOpen(true);
                                } finally {
                                  setUploadingSora(false);
                                  e.target.value = '';
                                }
                              }} />
                            </Button>
                            {soraUrl && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSoraUrl('');
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  bgcolor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  p: 0.25,
                                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                                }}
                              >
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Aspect Ratio</InputLabel>
                              <Select
                                value={aspectRatio}
                                label="Aspect Ratio"
                                onChange={(e) => setAspectRatio(e.target.value)}
                              >
                                <MenuItem value="9:16">Portrait (9:16)</MenuItem>
                                <MenuItem value="16:9">Cinema (16:9)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Duration (Seconds)</InputLabel>
                              <Select
                                value={duration}
                                label="Duration (Seconds)"
                                onChange={(e) => setDuration(Number(e.target.value))}
                              >
                                <MenuItem value={10}>10s</MenuItem>
                                <MenuItem value={15}>15s</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>

                        <FormControl fullWidth size="small">
                          <InputLabel>Size (Quality)</InputLabel>
                          <Select
                            value={size}
                            label="Size (Quality)"
                            onChange={(e) => setSize(e.target.value)}
                          >
                            <MenuItem value="small">Small (Standard)</MenuItem>
                            <MenuItem value="large">Large (HD)</MenuItem>
                          </Select>
                        </FormControl>
                          </>
                        )}
                      </>
                    ) : (
                      /* Nano Banana 表单字段 */
                      <>
                        <FormControl fullWidth size="small">
                          <InputLabel>Model</InputLabel>
                          <Select
                            value={nanoModel}
                            label="Model"
                            onChange={(e) => setNanoModel(e.target.value)}
                          >
                            <MenuItem value="nano-banana-2">Nano Banana 2</MenuItem>
                            <MenuItem value="nano-banana">Nano Banana</MenuItem>
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>Aspect Ratio</InputLabel>
                          <Select
                            value={aspectRatio}
                            label="Aspect Ratio"
                            onChange={(e) => setAspectRatio(e.target.value)}
                          >
                            <MenuItem value="16:9">16:9</MenuItem>
                            <MenuItem value="9:16">9:16</MenuItem>
                            <MenuItem value="1:1">1:1</MenuItem>
                            <MenuItem value="4:3">4:3</MenuItem>
                            <MenuItem value="3:4">3:4</MenuItem>
                          </Select>
                        </FormControl>

                        {nanoModel === 'nano-banana-2' && (
                          <FormControl fullWidth size="small">
                            <InputLabel>Image Size</InputLabel>
                            <Select
                              value={nanoImageSize}
                              label="Image Size"
                              onChange={(e) => setNanoImageSize(e.target.value)}
                            >
                              <MenuItem value="1K">1K</MenuItem>
                              <MenuItem value="2K">2K</MenuItem>
                              <MenuItem value="4K">4K</MenuItem>
                            </Select>
                          </FormControl>
                        )}

                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>参考图 (Reference Images)</Typography>

                          {/* 上传按钮：大正方形，图片列表在下方 */}
                          <Box>
                            {/* 上传按钮 */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 110, mb: 1 }}>
                              <Button
                                variant="outlined"
                                component="label"
                                disabled={uploadingNano}
                                sx={{
                                  width: '100%',
                                  aspectRatio: '1/1',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px dashed #e2e8f0',
                                  borderRadius: 2,
                                  color: 'text.secondary',
                                  overflow: 'hidden',
                                  p: 0,
                                  '&:hover': {
                                    border: '2px dashed #f59e0b',
                                    bgcolor: 'rgba(245, 158, 11, 0.04)'
                                  }
                                }}
                              >
                                {uploadingNano ? (
                                  <CircularProgress size={24} sx={{ color: '#f59e0b' }} />
                                ) : (
                                  <>
                                    <AddPhotoAlternateIcon sx={{ fontSize: 32, mb: 0.5, color: '#cbd5e1' }} />
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                      上传图片
                                    </Typography>
                                  </>
                                )}
                                <input type="file" accept="image/*" hidden onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingNano(true);
                                  try {
                                    const url = await uploadToSupabase(file);
                                    setNanoImages([...nanoImages, url]);
                                    setSnackbarMsg('参考图上传成功');
                                    setSnackbarOpen(true);
                                  } catch (err: any) {
                                    setSnackbarMsg(err.message || '上传失败');
                                    setSnackbarOpen(true);
                                  } finally {
                                    setUploadingNano(false);
                                    e.target.value = '';
                                  }
                                }} />
                              </Button>
                            </Box>

                            {/* 图片列表：下方小图 */}
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {nanoImages.map((img, idx) => (
                                <Box key={idx} sx={{
                                  position: 'relative',
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  border: '1px solid #e2e8f0',
                                  '&:hover .delete-btn': { opacity: 1 }
                                }}>
                                  <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <IconButton
                                    className="delete-btn"
                                    size="small"
                                    onClick={() => {
                                      const newImages = [...nanoImages];
                                      newImages.splice(idx, 1);
                                      setNanoImages(newImages);
                                    }}
                                    sx={{
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      bgcolor: 'rgba(0,0,0,0.5)',
                                      color: 'white',
                                      p: 0.25,
                                      opacity: 0,
                                      transition: 'opacity 0.2s',
                                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto" pb={2}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setPrompt('');
                          setImage1('');
                          setImage2('');
                          setImage3('');
                          setSoraUrl('');
                          setNanoImages([]);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleGenerate}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PlayCircleOutlineIcon />}
                        sx={{
                          px: 4,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                        }}
                      >
                        {isSubmitting ? 'Generating...' : 'Generate'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
                {/* 右侧结果区域：统一的大容器，包含大图预览和历史记录 */}
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  mr: { xs: 0, lg: 3 },
                  height: 'calc(100vh - 200px)',
                  minHeight: 600,
                  position: 'relative',
                  // 悬浮时触发子元素动画
                  '&:hover .border-anim': {
                    // Red: 100% 0% (BL) -> 100% 100% (TL)
                    // Blue: 0% 100% (TR) -> 0% 0% (BR)
                    backgroundPosition: '100% 100%, 0% 0%',
                  }
                }}>
                  {/* 1. 独立边框层：仅显示边框线条，中间镂空，避免影响内部半透明背景 */}
                  <Box className="border-anim" sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    padding: '2px', // 边框宽度
                    
                    // 使用两个径向渐变模拟移动的光斑
                    // 1. 红色光斑 (Red Spot)
                    // 2. 蓝色光斑 (Blue Spot)
                    backgroundImage: `
                      radial-gradient(circle at center, #ef4444 0%, transparent 50%),
                      radial-gradient(circle at center, #3b82f6 0%, transparent 50%)
                    `,
                    backgroundSize: '200% 200%, 200% 200%', // 2倍大小，便于计算位置
                    backgroundRepeat: 'no-repeat, no-repeat',
                    
                    // 初始位置 (基于 200% 大小的计算)：
                    // Red (Bottom Left): 100% 0%
                    // Blue (Top Right): 0% 100%
                    backgroundPosition: '100% 0%, 0% 100%',
                    
                    transition: 'background-position 1.5s ease', // 平滑移动动画
                    
                    // 核心：使用 mask 镂空中间区域，只保留 2px 边框
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    
                    pointerEvents: 'none',
                    zIndex: 1,
                  }} />

                  {/* 2. 内容层：负责背景、滚动和内容展示 */}
                  <Box sx={{
                    flex: 1,
                    background: 'rgba(170, 210, 255, 0.35)', // 纯净的冰雪背景
                    backdropFilter: 'blur(12px) saturate(110%)',
                    borderRadius: '24px', // 与边框一致
                    overflow: 'hidden', // 裁剪内部滚动条圆角
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 0,
                    boxShadow: 'none',
                  }}>
                    <Box sx={{
                      flex: 1,
                      overflowY: 'auto',
                      p: 3,
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      
                      // 顶部高光装饰
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                        opacity: 0.7,
                        pointerEvents: 'none'
                      }
                    }}>

                  {/* 统一结果展示区域：Grid 布局 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                    {/* 1. 当前生成任务或最近成功任务（统一隐藏，全部用队列卡片展示，保证三模块表现一致） */}
                    {(() => {
                      // 统一不用单独“当前卡片”，保持三模块一致，仅展示下方队列卡片
                      return null;
                      // 计算最近一个可展示的视频：优先当前 generationResult；否则最近成功的队列任务
                      const latestSucceededJob = jobs.find(j => j.status === 'succeeded' && j.result?.video_url);
                      const hasCurrent = Boolean(generationResult);
                      const videoSrcStr = hasCurrent
                        ? (typeof generationResult?.data?.output === 'string')
                          ? generationResult.data.output
                          : (generationResult?.data?.video_url || generationResult?.video_url)
                        : latestSucceededJob?.result?.video_url;
                      // 非 Sora 标签：按常规逻辑显示当前卡片
                      const showCard = (isGenerating || hasCurrent || Boolean(videoSrcStr));
                      if (!showCard) return null;
                      const modelLabel = (taskId || isGenerating)
                        ? generatingModelRef.current
                        : (generationResult?._model || latestSucceededJob?.model || '');
                      return (
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                          height: 120,
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.06)',
                          '&:hover .model-tag': { opacity: 1 },
                          '&:hover .delete-btn': { opacity: 1 }
                        }}>
                          {/* 当前结果卡片的删除按钮（右上角方形，悬浮变色） */}
                          <IconButton
                            className="delete-btn"
                            aria-label="删除"
                            onClick={() => {
                              // 取消当前查询与UI显示
                              // 1) 停止轮询
                              if (pollTimerRef.current) {
                                clearInterval(pollTimerRef.current);
                                pollTimerRef.current = null;
                              }
                              pollingActiveRef.current = false;
                              // 2) 清除当前任务状态
                              setTaskId(null);
                              setIsGenerating(false);
                              // 3) 清空当前结果卡片
                              setGenerationResult(null);
                              // 4) 可选：标记队列中运行的任务为已取消（不强制删除，避免历史丢失）
                              setJobs(prev => prev.map(j => j.status === 'running' && j.taskId ? { ...j, status: 'failed', error: '用户已取消' } : j));
                              // 5) 反馈
                              setSnackbarMsg('已取消查询');
                              setSnackbarOpen(true);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 26,
                              height: 26,
                              borderRadius: 1,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.2)',
                              zIndex: 3,
                              opacity: 0,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(239,68,68,0.8)',
                                borderColor: 'rgba(255,255,255,0.35)'
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          {/* 模型标签 */}
                          {modelLabel && (
                            <Chip
                              className="model-tag"
                              label={modelLabel}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                zIndex: 2,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                backdropFilter: 'blur(4px)',
                                height: 20,
                                borderRadius: '4px',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '& .MuiChip-label': { px: 0.8, fontSize: '0.7rem', fontWeight: 600 }
                              }}
                            />
                          )}

                          {(Boolean(taskId) && !generationResult) ? (
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
                                  transform: 'skewX(-20deg)',
                                  animation: `${shine} 1.8s linear infinite`,
                                }
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  position: 'relative',
                                  zIndex: 1,
                                  color: 'rgba(255,255,255,0.85)',
                                  letterSpacing: 1,
                                  animation: `${blink} 2.4s ease-in-out infinite`,
                                }}
                              >
                                正在生成...
                              </Typography>
                            </Box>
                          ) : (
                            <>
                              {generationResult?.data && generationResult.data[0]?.url ? (
                                <img
                                  src={generationResult.data[0].url}
                                  style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                  alt="Generated"
                                />
                              ) : videoSrcStr ? (
                                <VideoWithLoader style={{ height: '100%', width: '100%', objectFit: 'cover' }} src={videoSrcStr} />
                              ) : (
                                <Box textAlign="center" p={1}>
                                  <Typography variant="caption" color="success.main">完成</Typography>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      </Box>
                      );
                    })()}

                    {/* 2. 历史记录卡片（在任意模型下显示，不再按模块过滤） */}
                    {(() => {
                      // 基于 URL 去重，避免同一视频/图片重复显示
                      const seen = new Set<string>();
                      // 当存在“当前生成卡片”时，避免列表再展示进行中的占位（queued/submitting/running）
                      const isShowingCurrentCard = isGenerating || Boolean(generationResult);
                      const deduped = jobs
                        // 不再按模块过滤，所有模块（veo/sora/nano）的历史都展示
                        .filter(() => true)
                        // 过滤 Sora/Nano 的失败任务：失败即取消 UI（Nano 失败卡直接不展示）
                        .filter(j => !((j.module === 'sora' || j.module === 'nano') && j.status === 'failed'))
                        // 对已成功的直链做去重
                        .filter(j => {
                        const url = j.result?.video_url || j.result?.image_url || '';
                          if (!url) return true; // 保留已完成但尚未解析到直链的记录（若存在）
                        const key = String(url);
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });
                      return deduped.map((job) => (
                      <Box key={job.id} sx={{ position: 'relative' }}>
                          <Box sx={{
                          height: 120,
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.06)',
                            '&:hover .model-tag': { opacity: 1 },
                            '&:hover .delete-btn': { opacity: 1 }
                        }}>
                               {/* 删除按钮（右上角方形，悬浮变色） */}
                           <IconButton
                             className="delete-btn"
                                 aria-label="删除"
                                 onClick={() => {
                                   // 全局同步删除：同一资源（相同 video_url / image_url）的所有卡片一起移除
                                   const keyUrl = job.result?.video_url || job.result?.image_url || '';
                                   setJobs(prev => prev.filter(j => {
                                     const url = j.result?.video_url || j.result?.image_url || '';
                                     if (keyUrl) return url !== keyUrl; // 删除同源资源
                                     return j.id !== job.id; // 无直链则按 id 删除
                                   }));
                                 }}
                                 sx={{
                                   position: 'absolute',
                                   top: 6,
                                   right: 6,
                                   width: 26,
                                   height: 26,
                                   borderRadius: 1, // 方形
                                   bgcolor: 'rgba(0,0,0,0.5)',
                                   color: 'white',
                                   border: '1px solid rgba(255,255,255,0.2)',
                               zIndex: 3,
                               opacity: 0,
                                   transition: 'all 0.2s ease',
                                   '&:hover': {
                                     bgcolor: 'rgba(239,68,68,0.8)', // 红色高亮
                                     borderColor: 'rgba(255,255,255,0.35)'
                                   }
                                 }}
                               >
                                 <CloseIcon sx={{ fontSize: 16 }} />
                               </IconButton>
                          {/* 模型标签 */}
                          <Chip
                            className="model-tag"
                            label={job.module === 'sora' ? (job.sora_url ? 'sora图' : 'sora2文') : job.model}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              zIndex: 2,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              backdropFilter: 'blur(4px)',
                              height: 20,
                              borderRadius: '4px',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '& .MuiChip-label': { px: 0.8, fontSize: '0.7rem', fontWeight: 600 }
                            }}
                          />

                          {job.result?.video_url ? (
                            <VideoWithLoader
                              style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                              src={job.result.video_url}
                            />
                          ) : job.result?.image_url ? (
                            <img src={job.result.image_url} alt="result" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
                                  transform: 'skewX(-20deg)',
                                  animation: `${shine} 1.8s linear infinite`,
                                }
                              }}
                            >
                              {job.status === 'failed' ? (
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    color: 'error.main',
                                    letterSpacing: 0.5,
                                    fontWeight: 600,
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '1px solid rgba(239,68,68,0.5)',
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.5
                                  }}
                                >
                                  {job.error || '生成失败'}
                                </Typography>
                              ) : job.status === 'succeeded' ? (
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    color: 'success.main',
                                    letterSpacing: 0.5,
                                    fontWeight: 600,
                                    background: 'rgba(16,185,129,0.15)',
                                    border: '1px solid rgba(16,185,129,0.5)',
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.5
                                  }}
                                >
                                  完成
                                </Typography>
                              ) : (
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    color: 'rgba(255,255,255,0.85)',
                                    letterSpacing: 1,
                                    animation: `${blink} 2.4s ease-in-out infinite`,
                                  }}
                                >
                                  正在生成...
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                  ));
                })()}
                  </Box>

                  {/* 3. Empty State (既没生成，也没历史) */}
                  {!isGenerating && !generationResult && (!jobs || jobs.length === 0) && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.8, minHeight: 400 }}>
                      <Typography variant="h5" fontWeight={900} letterSpacing={2} sx={{ 
                        color: 'white',
                        WebkitTextStroke: '1px black',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>RESULT</Typography>
                      <Typography variant="body1" sx={{ 
                        mt: 1,
                        color: 'white',
                        WebkitTextStroke: '0.5px black',
                        fontWeight: 500
                      }}>Your result will appear here</Typography>
                    </Box>
                  )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMsg.includes('失败') ? 'error' : 'info'} sx={{ width: '100%' }}>
            {snackbarMsg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default HomePage;

