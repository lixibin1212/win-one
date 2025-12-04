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
  Container,
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
import { createClient } from '@supabase/supabase-js';

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
        root: { textTransform: 'none', fontWeight: 600 }
      }
    }
  }
});

// 扫光动画
const shine = keyframes`
  0% { left: -100%; }
  100% { left: 200%; }
`;

// 轻量卡片通用样式
const cardBase = {
  p: 3,
  bgcolor: 'white',
  border: '1px solid #e2e8f0',
  '&:hover': { boxShadow: '0 10px 24px -6px rgba(30,64,175,0.15)' }
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
// Supabase 配置
const SUPABASE_URL = 'https://vvrexwgovtnjdcdlwciw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cmV4d2dvdnRuamRjZGx3Y2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTcyODUsImV4cCI6MjA3OTEzMzI4NX0.RqJXqlwnQggkeMAhd6FRcb4ofxZ3xqDn-KYQ-TScf1s';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPABASE_BUCKET = 'uploads';

// 轮播图组件
const Carousel = () => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { label: '欢迎回来', desc: '高效完成您的工作', bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
    { label: '系统更新', desc: 'V2.0 版本已上线', bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    { label: '安全提醒', desc: '请定期修改您的密码', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        height: { xs: 300, sm: 360, md: 400 },
        borderRadius: 0,
        overflow: 'hidden',
        position: 'relative',
        mb: 3,
        background: steps[activeStep].bg,
        transition: 'background 1s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, md: 6 },
        color: 'white'
      }}
    >
      <Typography variant="h4" fontWeight={800} sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        {steps[activeStep].label}
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
        {steps[activeStep].desc}
      </Typography>
      
      <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
        {steps.map((_, index) => (
          <Box
            key={index}
            onClick={() => setActiveStep(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: index === activeStep ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // 标签页状态
  const [activeTab, setActiveTab] = useState<'veo2' | 'veo3' | 'veo3+' | 'sora2'>('veo2');
  // 模块选择状态
  const [currentModule, setCurrentModule] = useState<'veo' | 'sora' | 'nano'>('veo');

  // 模型选择状态
  const [selectedModel, setSelectedModel] = useState<string>('veo2');
  
  // Nano Banana states
  const [nanoModel, setNanoModel] = useState('nano-banana-2');
  const [nanoImageSize, setNanoImageSize] = useState('1K');
  const [nanoImages, setNanoImages] = useState<string[]>([]);
  const [nanoInputImage, setNanoInputImage] = useState('');

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
  const [soraUrl, setSoraUrl] = useState(''); // Sora 专用 URL
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 获取用户信息
    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        navigate('/login');
      });
  }, [navigate]);

  // 轮询任务状态
  useEffect(() => {
    if (taskId) {
      const checkStatus = async () => {
        try {
          const token = localStorage.getItem('access_token');
          // 根据当前模块选择不同的查询接口
          // Nano 模块不需要轮询，直接返回结果，所以这里不需要处理 nano
          const statusUrl = currentModule === 'sora' 
            ? `${API_BASE}/api/proxy/sora/result/${taskId}`
            : `${API_BASE}/api/tasks/${taskId}`;

          const res = await fetch(statusUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // 假设 API 返回 status 字段，根据实际情况调整
            // 这里假设 'succeeded' 或 'completed' 为成功
            if (data.status === 'succeeded' || data.status === 'completed' || data.data?.status === 'succeeded') {
               setGenerationResult(data);
               setIsGenerating(false);
               setTaskId(null);
               setSnackbarMsg('视频生成成功！');
               setSnackbarOpen(true);
            } else if (data.status === 'failed' || data.error) {
               setIsGenerating(false);
               setTaskId(null);
               setSnackbarMsg('视频生成失败: ' + (data.error?.message || data.error || '未知错误'));
               setSnackbarOpen(true);
            }
            // 如果是 processing 或 pending，继续轮询
          }
        } catch (error) {
          console.error("Poll error", error);
        }
      };

      pollTimerRef.current = setInterval(checkStatus, 3000); // 每3秒轮询一次
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
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
    setNanoImages([]);
  }, [selectedModel, currentModule]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
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

    setIsGenerating(true);
    setGenerationResult(null);
    setTaskId(null);

    const token = localStorage.getItem('access_token');
    let endpoint = '';
    let payload: any = {};

    if (currentModule === 'sora') {
      endpoint = '/api/proxy/sora/generate';
      payload = {
        prompt,
        aspectRatio,
        duration,
        size,
        url: soraUrl || undefined
      };
    } else if (currentModule === 'nano') {
      endpoint = '/api/proxy/nano/generate';
      payload = {
        model: nanoModel,
        prompt,
        aspect_ratio: aspectRatio,
        image_size: nanoModel === 'nano-banana-2' ? nanoImageSize : undefined,
        images: nanoImages.length > 0 ? nanoImages : undefined
      };
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
          // Nano 直接返回结果
          setGenerationResult(data);
          setIsGenerating(false);
          setSnackbarMsg('图片生成成功！');
          setSnackbarOpen(true);
      } else {
          setTaskId(data.task_id);
          setSnackbarMsg('任务已提交，正在生成中...');
          setSnackbarOpen(true);
      }

    } catch (error: any) {
      setIsGenerating(false);
      setSnackbarMsg(error.message);
      setSnackbarOpen(true);
    }
  };

  // 上传到 Supabase 并返回公开 URL
  const uploadToSupabase = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const path = `veo/${id}.${ext}`;
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
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f5f8fc 0%,#eef4fa 50%,#eaf2fb 100%)', pb: 4 }}>
        {/* 1. 顶部导航栏 */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1e293b', fontWeight: 700 }}>
              Vwin Dashboard
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" sx={{ color: '#1e293b', display: { xs: 'none', sm: 'block' } }}>
                  {user?.username}
                </Typography>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: '#2563eb', width: 40, height: 40 }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleClose}>个人中心</MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    退出登录
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Carousel />
          
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
                        '&.Mui-selected': { bgcolor: 'rgba(37, 99, 235, 0.12)' }
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
                        '&.Mui-selected': { bgcolor: 'rgba(16, 185, 129, 0.12)' }
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
                        '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.12)' }
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
                    /* Sora Tab */
                    <Box 
                      onClick={() => setActiveTab('sora2')}
                      sx={{ 
                        position: 'relative',
                        bgcolor: '#10b981', 
                        color: 'white', 
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
                  <Box sx={{ flex: { xs: '1 1 auto', lg: '0 0 40%' }, display: 'flex', flexDirection: 'column', minHeight: 440 }}>
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
                              {selectedModel === 'veo2-fast-frames' ? (
                                <>
                                  {/* 上传框并行显示：首帧与尾帧 */}
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {/* 本地上传：首帧 Image 1 */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 120 }}>
                                      <Typography variant="caption" color="text.secondary">首帧参考（Image 1）</Typography>
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 120 }}>
                                      <Typography variant="caption" color="text.secondary">尾帧参考（Image 2）</Typography>
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
                                  </Box>
                                </>
                              ) : (
                                <>
                                  {/* URL 输入模式：Image 1 */}
                                  <TextField
                                    label="Image 1 URL (首帧参考)"
                                    placeholder="https://example.com/image1.jpg"
                                    fullWidth
                                    value={image1}
                                    onChange={(e) => setImage1(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{ startAdornment: <ImageSearchIcon color="action" sx={{ mr: 1 }} /> }}
                                  />
                                  {/* URL 输入模式：Image 2（除单图外） */}
                                  {selectedModel !== 'veo3-pro-frames' && (
                                    <TextField
                                      label="Image 2 URL (尾帧参考 - 可选)"
                                      placeholder="https://example.com/image2.jpg"
                                      fullWidth
                                      value={image2}
                                      onChange={(e) => setImage2(e.target.value)}
                                      variant="outlined"
                                      size="small"
                                      InputProps={{ startAdornment: <ImageSearchIcon color="action" sx={{ mr: 1 }} /> }}
                                    />
                                  )}
                                </>
                              )}

                              {/* Image 3: 仅适用于 veo3.1-components */}
                              {selectedModel === 'veo3.1-components' && (
                                <TextField
                                  label="Image 3 URL (中间帧参考 - 可选)"
                                  placeholder="https://example.com/image3.jpg"
                                  fullWidth
                                  value={image3}
                                  onChange={(e) => setImage3(e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <ImageSearchIcon color="action" sx={{ mr: 1 }} />,
                                  }}
                                />
                              )}

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
                          <TextField
                            label="Reference Image URL (参考图片 - 选填)"
                            placeholder="https://example.com/image.jpg"
                            fullWidth
                            value={soraUrl}
                            onChange={(e) => setSoraUrl(e.target.value)}
                            variant="outlined"
                            size="small"
                            InputProps={{
                              startAdornment: <ImageSearchIcon color="action" sx={{ mr: 1 }} />,
                            }}
                          />

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
                            <Box display="flex" gap={1} mb={1}>
                                <TextField
                                  label="Add Reference Image URL"
                                  placeholder="https://example.com/image.jpg"
                                  fullWidth
                                  value={nanoInputImage}
                                  onChange={(e) => setNanoInputImage(e.target.value)}
                                  variant="outlined"
                                  size="small"
                                />
                                <Button variant="outlined" onClick={() => {
                                    if(nanoInputImage) {
                                        setNanoImages([...nanoImages, nanoInputImage]);
                                        setNanoInputImage('');
                                    }
                                }}>Add</Button>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {nanoImages.map((img, idx) => (
                                    <Chip 
                                        key={idx} 
                                        label={`Image ${idx + 1}`} 
                                        onDelete={() => {
                                            const newImages = [...nanoImages];
                                            newImages.splice(idx, 1);
                                            setNanoImages(newImages);
                                        }} 
                                        variant="outlined"
                                    />
                                ))}
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
                          disabled={isGenerating}
                          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PlayCircleOutlineIcon />}
                          sx={{ 
                            px: 4,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                          }}
                        >
                          {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                  {/* 右侧结果区域：保证不高于左侧表单底部 */}
                  <Box sx={{ flex: { xs: '1 1 auto', lg: '0 0 60%' }, display: 'flex', flexDirection: 'column', mr: { xs: 0, lg: 1.5 }, minHeight: 440 }}>
                    <Box sx={{ flex: 1, bgcolor: '#0f172a', color: 'white', borderRadius: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', mr: { xs: 0, lg: 2 }, mb: 2 }}>
                      {isGenerating ? (
                        <Box textAlign="center">
                          <CircularProgress sx={{ color: '#3b82f6', mb: 2 }} size={56} />
                          <Typography variant="subtitle1">正在生成...</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>这可能需要几分钟时间</Typography>
                        </Box>
                      ) : generationResult ? (
                        <Box width="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
                          {generationResult.data && generationResult.data[0]?.url ? (
                             <img 
                                src={generationResult.data[0].url} 
                                style={{ width: '100%', maxHeight: 340, borderRadius: 8, boxShadow: '0 0 16px rgba(0,0,0,0.4)', objectFit: 'contain' }} 
                                alt="Generated"
                             />
                          ) : generationResult.data?.video_url || generationResult.video_url ? (
                            <video
                              controls
                              autoPlay
                              loop
                              style={{ width: '100%', maxHeight: 340, borderRadius: 8, boxShadow: '0 0 16px rgba(0,0,0,0.4)' }}
                              src={generationResult.data?.video_url || generationResult.video_url}
                            />
                          ) : (
                            <Box textAlign="center">
                              <Typography variant="subtitle1" color="success.main">生成完成</Typography>
                              <Typography variant="caption" sx={{ mt: 1, opacity: 0.8 }}>
                                {JSON.stringify(generationResult, null, 2)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box textAlign="center" sx={{ opacity: 0.5 }}>
                          <MovieCreationIcon sx={{ fontSize: 64, mb: 1 }} />
                          <Typography variant="subtitle1" fontWeight={700} letterSpacing={1}>RESULT</Typography>
                          <Typography variant="caption">Your result will appear here</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
          </Box>
        </Container>

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

