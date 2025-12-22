import React, { useState, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from './AuthContext';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    background: { default: '#ffffff' },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif',
    h5: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            background: '#fff',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 32 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { fontSize: 13, color: '#94a3b8' },
      },
    },
  },
});

// 环境变量配置（后端地址与 hCaptcha 测试密钥）
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
const HCAPTCHA_SITE_KEY = process.env.REACT_APP_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'; // 测试密钥

// 新的卡片风格：大圆角 + 柔和投影 + 轻渐变
const glassBg = {
  // 更玻璃态：半透明白 + 强一些的模糊 + 轻边框
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  // 四角适中圆角
  borderRadius: '18px',
  boxShadow: '0 18px 60px -12px rgba(30,64,175,0.22), 0 2px 6px rgba(0,0,0,0.05)',
  border: '1px solid rgba(255,255,255,0.45)',
  padding: '56px 48px 48px',
};

type PageType = 'login' | 'register' | 'home' | 'verify-email' | 'verify-pending' | 'forgot-password' | 'reset-password';

const App = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [page, setPage] = useState<PageType>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [suspiciousLogin, setSuspiciousLogin] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  // Google 脚本加载就绪检测（避免按钮区域空白）
  const [googleReady, setGoogleReady] = useState(false);
  useEffect(() => {
    const check = () => {
      const ready = !!(window as any)?.google?.accounts?.id;
      setGoogleReady(ready);
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, []);

  // 密码强度验证
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return '密码至少8位';
    if (!/[A-Z]/.test(pwd)) return '密码必须包含大写字母';
    if (!/[a-z]/.test(pwd)) return '密码必须包含小写字母';
    if (!/[0-9]/.test(pwd)) return '密码必须包含数字';
    return null;
  };

  // 用户名验证
  const validateUsername = (name: string): string | null => {
    if (name.length < 3 || name.length > 20) return '用户名必须是3-20位';
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return '用户名只能包含字母、数字和下划线';
    return null;
  };

  // 处理注册
  const handleRegister = async () => {
    setError(null);
    setSuccess(null);

    console.log('🚀 开始注册流程...');
    console.log('📝 用户名:', username);
    console.log('📧 邮箱:', email);
    console.log('🔑 验证码Token:', captchaToken);

    // 验证
    const usernameError = validateUsername(username);
    if (usernameError) {
      console.error('❌ 用户名验证失败:', usernameError);
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      console.error('❌ 密码验证失败:', passwordError);
      setError(passwordError);
      return;
    }

    if (!captchaToken) {
      console.error('❌ 缺少验证码');
      setError('请完成验证码验证');
      return;
    }

    setLoading(true);

    try {
      console.log('=== 开始注册流程 ===');
      console.log('API_BASE:', API_BASE);
      console.log('📡 完整 URL:', `${API_BASE}/register`);
      console.log('📊 请求数据:', { username, email, captcha_token: captchaToken ? '已提供' : '未提供' });
      
      // 先测试简单的 GET 请求
      console.log('🧪 测试 1: 尝试 GET 请求根路径...');
      try {
        const testRes = await fetch(`${API_BASE}/`, { method: 'GET', mode: 'cors' });
        console.log('✅ 根路径测试成功:', testRes.status);
      } catch (testErr) {
        console.error('❌ 根路径测试失败:', testErr);
        const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
        throw new Error(`后端连接失败: ${errMsg}`);
      }
      
      console.log('🧪 测试 2: 发送注册请求...');
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          captcha_token: captchaToken,
        }),
      });
      console.log('✅ 注册请求已发送，状态码:', res.status);

      console.log('📥 收到响应，状态码:', res.status);
      
      const data = await res.json();
      console.log('📦 响应数据:', data);

      if (!res.ok) {
        throw new Error(data.detail || '注册失败');
      }

      console.log('✅ 注册成功！');
      setSuccess(data.message);
      setPage('verify-pending');
      setEmail(data.email);
    } catch (e: any) {
      console.error('❌ 注册失败:', e);
      console.error('错误详情:', e.message);
      setError(e.message || '注册失败');
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // 处理登录
  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    setSuspiciousLogin(false);

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      // 预检测后端根路径连通性，快速暴露 API_BASE 配置问题
      try {
        const ping = await fetch(`${API_BASE}/`, { method: 'GET', mode: 'cors' });
        if (!ping.ok) {
          console.warn('⚠️ 后端根路径非 2xx:', ping.status);
          setError(`[PING] 后端根路径响应异常 HTTP ${ping.status}`);
          return;
        }
      } catch (netErr) {
        console.error('❌ 无法连接后端根路径:', netErr);
        setError('[PING] 无法连接后端服务，检查是否已启动或 API_BASE 是否正确');
        return;
      }

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      console.log('🔑 发送登录请求:', { username });

      let res: Response;
      try {
        res = await fetch(`${API_BASE}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
          mode: 'cors',
          credentials: 'include',
        });
      } catch (fetchErr: any) {
        console.error('❌ /token 请求网络层失败:', fetchErr);
        setError('[TOKEN_NET] 无法访问 /token (可能是 CORS、端口不一致或服务未启动)');
        return;
      }

      console.log('📡 登录响应状态:', res.status);

      let data: any;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('❌ /token 响应解析失败:', parseErr);
        setError('[TOKEN_PARSE] 登录响应不是有效 JSON');
        return;
      }

      console.log('📦 登录响应数据:', data);

      if (!res.ok) {
        throw new Error(data.detail || '登录失败');
      }

      localStorage.setItem('access_token', data.access_token);

      if (data.suspicious_login) {
        setSuspiciousLogin(true);
      }

      // 刷新全局用户上下文，避免必须刷新页面才显示用户名/积分
      try { await refreshUser(); } catch {}

      // 获取用户信息（更严格的错误处理，便于定位问题）
      let userRes: Response;
      try {
        userRes = await fetch(`${API_BASE}/me`, {
          mode: 'cors',
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
      } catch (meErr: any) {
        console.error('❌ /me 请求网络层失败:', meErr);
        setError('[ME_NET] 获取用户信息网络失败: 检查后端是否开启或 CORS 设置');
        return;
      }

      if (!userRes.ok) {
        let errMsg = `[ME_RESP] 获取用户信息失败 HTTP ${userRes.status}`;
        try {
          const errJson = await userRes.json();
          if (errJson?.detail) errMsg = `[ME_RESP] ${String(errJson.detail)}`;
        } catch {}
        throw new Error(errMsg);
      }

      const userData = await userRes.json();
      setUser(userData);
      navigate('/home');
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 忘记密码 - 发送重置邮件
  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 发送密码重置请求:', email);

      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        mode: 'cors',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || '发送失败');
      }

      console.log('✅ 密码重置邮件已发送');
      setSuccess('重置链接已发送到您的邮箱，请查收');
    } catch (e: any) {
      console.error('❌ 发送失败:', e);
      setError(e.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 提交新密码');

      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: resetToken, 
          new_password: newPassword 
        }),
        mode: 'cors',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || '重置失败');
      }

      console.log('✅ 密码重置成功');
      setSuccess('密码重置成功!请使用新密码登录');
      setTimeout(() => {
        setPage('login');
        setNewPassword('');
        setResetToken('');
      }, 2000);
    } catch (e: any) {
      console.error('❌ 重置失败:', e);
      setError(e.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  // Google 登录
  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Google登录失败');
      }

      localStorage.setItem('access_token', data.access_token);

  // 刷新上下文，确保首页右上角立即显示用户名与积分
  try { await refreshUser(); } catch {}

      // 获取用户信息
      const userRes = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      const userData = await userRes.json();
      setUser(userData);
      navigate('/home');
    } catch (e: any) {
      setError(e.message || 'Google登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 重新发送验证邮件
  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || '发送失败');
      }

      setSuccess(data.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 验证邮箱和密码重置页面
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('token');
    const currentPath = window.location.pathname;

    // 检查是否是密码重置页面
    if (currentPath.includes('/reset-password') && verifyToken) {
      setPage('reset-password');
      setResetToken(verifyToken);
      return;
    }

    // 检查是否是邮箱验证页面
    if (verifyToken) {
      setPage('verify-email');
      setLoading(true);

      fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            setSuccess('邮箱验证成功！正在跳转...');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            setError(data.detail || '验证失败');
          }
        })
        .catch((e) => {
          setError('验证失败：' + e.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // 等待邮箱验证页面
  if (page === 'verify-pending') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          width="100vw"
          sx={{
            background: 'linear-gradient(135deg,#e0edff 0%,#98c7f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper elevation={24} sx={{ ...glassBg, minWidth: 380, maxWidth: 500 }}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: '#2563eb', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <EmailIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                验证邮件已发送
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                我们已向 <Box component="span" fontWeight={600} display="inline">{email}</Box> 发送了一封验证邮件，请查收并点击邮件中的链接激活账号。
              </Typography>

              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Button
                variant="outlined"
                fullWidth
                onClick={handleResendVerification}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : '重新发送验证邮件'}
              </Button>

              <Link
                component="button"
                onClick={() => setPage('login')}
                sx={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                返回登录
              </Link>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // 邮箱验证中页面
  if (page === 'verify-email') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          width="100vw"
          sx={{
            background: 'linear-gradient(135deg,#e0edff 0%,#98c7f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper elevation={24} sx={{ ...glassBg, minWidth: 380, maxWidth: 500 }}>
            <Box textAlign="center">
              {loading ? (
                <>
                  <CircularProgress size={64} sx={{ mb: 2 }} />
                  <Typography>正在验证邮箱...</Typography>
                </>
              ) : success ? (
                <>
                  <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                  <Alert severity="success">{success}</Alert>
                </>
              ) : (
                <>
                  <Alert severity="error">{error}</Alert>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => (window.location.href = '/')}
                  >
                    返回首页
                  </Button>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // 登录后主页
  if (page === 'home') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          width="100vw"
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 70% 30%, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.18) 35%, rgba(147,197,253,0) 70%)',
              filter: 'blur(38px)',
              opacity: 0.75,
            },
          }}
        >
          <Paper elevation={24} sx={{ ...glassBg, width: { xs: '92%', sm: 360, md: 380 }, maxWidth: 500 }}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: '#2964d4', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <LockOpenIcon />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                欢迎，{user?.username}
              </Typography>

              {suspiciousLogin && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  检测到可疑登录（新设备或新IP），如非本人操作请立即修改密码
                </Alert>
              )}

              <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.72)', borderRadius: 16 }}>
                <Typography color="text.secondary">
                  邮箱：<Box component="span" fontWeight={600} display="inline">{user?.email}</Box>
                  {user?.email_verified && (
                    <CheckCircleIcon color="success" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                  )}
                </Typography>
                <Typography color="text.secondary">角色：<Box component="span" fontWeight={600} display="inline">{user?.role}</Box></Typography>
                <Typography color="text.secondary">积分：<Box component="span" fontWeight={600} display="inline">{user?.points}</Box></Typography>
              </Paper>

              <Button
                color="primary"
                variant="outlined"
                fullWidth
                onClick={() => {
                  localStorage.removeItem('access_token');
                  setUser(null);
                  navigate('/');
                }}
              >
                退出登录
              </Button>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // 忘记密码页面
  if (page === 'forgot-password') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          width="100vw"
          sx={{
            background: 'linear-gradient(135deg,#e0edff 0%,#98c7f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper elevation={24} sx={{ ...glassBg, minWidth: 380, maxWidth: 500 }}>
            <Box textAlign="center" mb={3}>
              <Avatar sx={{ bgcolor: '#2964d4', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <EmailIcon />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                忘记密码
              </Typography>
              <Typography variant="body2" color="text.secondary">
                输入您的邮箱，我们将发送重置链接
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField
              fullWidth
              label="邮箱地址"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              InputProps={{ startAdornment: <EmailIcon color="primary" sx={{ mr: 1 }} /> }}
              sx={{ bgcolor: 'rgba(255,255,255,.9)', borderRadius: '12px', mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleForgotPassword}
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
                borderRadius: '12px',
                mb: 2,
              }}
            >
              {loading ? <CircularProgress size={24} /> : '发送重置链接'}
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={() => setPage('login')}
            >
              返回登录
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // 重置密码页面
  if (page === 'reset-password') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          minHeight="100vh"
          width="100vw"
          sx={{
            background: 'linear-gradient(135deg,#e0edff 0%,#98c7f5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper elevation={24} sx={{ ...glassBg, minWidth: 380, maxWidth: 500 }}>
            <Box textAlign="center" mb={3}>
              <Avatar sx={{ bgcolor: '#2964d4', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <LockOpenIcon />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                设置新密码
              </Typography>
              <Typography variant="body2" color="text.secondary">
                请输入您的新密码
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TextField
              fullWidth
              label="新密码"
              type="password"
              value={newPassword}
              onChange={(e: any) => setNewPassword(e.target.value)}
              InputProps={{ startAdornment: <LockOpenIcon color="primary" sx={{ mr: 1 }} /> }}
              sx={{ bgcolor: 'rgba(255,255,255,.9)', borderRadius: '12px', mb: 2 }}
              helperText="至少8位，包含大小写字母和数字"
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 3,
                borderRadius: '12px',
              }}
            >
              {loading ? <CircularProgress size={24} /> : '重置密码'}
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // 登录/注册页面
  return (
    <ThemeProvider theme={theme}>
      <Box
        minHeight="100vh"
        width="100vw"
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 让登录/注册页呈现半透明，能看见下层背景
          background: 'transparent',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            // 柔和的浅蓝光晕，叠加而不过度遮挡底层
            background: 'radial-gradient(circle at 70% 30%, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.18) 35%, rgba(147,197,253,0) 70%)',
            filter: 'blur(38px)',
            opacity: 0.75,
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...glassBg,
            // 响应式宽度：在更大屏幕稍微放宽，保持视觉平衡
            width: {
              xs: '92%',    // 手机基本占满，留少量边距
              sm: 360,      // 小屏（≥600px）
              md: 380,      // 中屏（≥900px）
              lg: 400,      // 大屏（≥1200px）
              xl: 420       // 超大屏（≥1536px）
            },
            maxWidth: 500, // 双保险，防止极端情况过宽
            // 根据屏幕尺寸调整内边距，保证内容密度合适
            p: {
              xs: '40px 30px 36px', // 移动端更紧凑
              sm: '50px 44px 44px',
              md: '54px 46px 46px',
              lg: '56px 48px 48px'  // 与原设计一致
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            position: 'relative',
            zIndex: 1,
            transition: 'width .25s ease, padding .25s ease',
          }}
        >
          
          <Avatar sx={{ bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: 68, height: 68, mb: 1 }} src="/logo192.png" />
          <Typography variant="h5" fontWeight={600} sx={{ color: '#1d4ed8', letterSpacing: '.5px' }}>
            {page === 'register' ? '注册新账号' : '登录系统'}
          </Typography>

          {/* Google 登录（脚本加载失败时显示回退提示，避免空白占位）*/}
          {googleReady ? (
            <Box width="100%" display="flex" flexDirection="column" alignItems="center" gap={2}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError('Google登录失败')}
                useOneTap
              />
              <Divider sx={{ width: '100%', mt: 1, mb: 0.5 }}>
                <Box component="span" sx={{ color: '#64748b' }}>或使用用户名{page === 'register' ? '注册' : '登录'}</Box>
              </Divider>
            </Box>
          ) : (
            <Box width="100%" display="flex" flexDirection="column" alignItems="center" gap={1.5}>
              <Alert severity="info" sx={{ width: '100%' }}>
                Google 登录暂不可用（脚本未加载）。请使用用户名{page === 'register' ? '注册' : '登录'}，或检查网络/浏览器扩展是否拦截了 accounts.google.com。
              </Alert>
              <Divider sx={{ width: '100%', mt: 0.5, mb: 0.5 }}>
                <Box component="span" sx={{ color: '#64748b' }}>继续使用用户名{page === 'register' ? '注册' : '登录'}</Box>
              </Divider>
            </Box>
          )}

          {/* 注册专用：用户名 */}
          {page === 'register' && (
            <TextField
              fullWidth
              size="small"
              label="用户名"
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              InputProps={{ startAdornment: <PersonIcon color="primary" sx={{ mr: 1 }} /> }}
              placeholder="3-20位字母、数字或下划线"
            />
          )}

          {/* 登录专用：用户名（不是邮箱） */}
          {page === 'login' && (
            <TextField
              fullWidth
              size="small"
              label="用户名"
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              InputProps={{ startAdornment: <PersonIcon color="primary" sx={{ mr: 1 }} /> }}
              placeholder="输入用户名"
            />
          )}

          {/* 注册专用：邮箱 */}
          {page === 'register' && (
            <TextField
              fullWidth
              size="small"
              label="邮箱"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              InputProps={{ startAdornment: <EmailIcon color="primary" sx={{ mr: 1 }} /> }}
              placeholder="填写真实有效邮箱"
            />
          )}

          {/* 密码 */}
          <TextField
            fullWidth
            size="small"
            label="密码"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            placeholder={page === 'register' ? '至少8位，含大小写字母和数字' : '输入密码'}
          />

          {/* hCaptcha 验证码 */}
          {page === 'register' && (
            <Box width="100%" display="flex" justifyContent="center" sx={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
              <HCaptcha
                ref={captchaRef}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={(token: string) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </Box>
          )}

          {/* 错误/成功提示 */}
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>}

          {/* 操作按钮 */}
          <Box width="100%" display="flex" gap={2} mt={1}>
            <Button
              disabled={loading}
              fullWidth
              color="primary"
              variant="contained"
              sx={{ py: 1.4 }}
              onClick={page === 'register' ? handleRegister : handleLogin}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : page === 'register' ? (
                '注册'
              ) : (
                '登录'
              )}
            </Button>
            <Button
              disabled={loading}
              fullWidth
              variant="outlined"
              onClick={() => {
                setPage(page === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
                setCaptchaToken(null);
              }}
            >
              {page === 'login' ? '去注册' : '去登录'}
            </Button>
          </Box>

          {/* 忘记密码链接 - 仅登录页显示 */}
          {page === 'login' && (
            <Box width="100%" textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setPage('forgot-password');
                  setError(null);
                  setSuccess(null);
                }}
                sx={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                忘记密码？
              </Link>
            </Box>
          )}

          {/* 安全标识已移除，根据需求不显示底部文字 */}
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default App;
