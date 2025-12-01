import React from 'react';
import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import App from './App';

// 将登录/注册卡片覆盖到首页之上，保留半透明与轻模糊以"稍微显示主页"
const AuthOverlay = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* 背景：完整首页 */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <LandingPage />
      </Box>

      {/* 半透明遮罩，弱化背景细节，阻止点击穿透 */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)'
        }}
      />

      {/* 页面左上角的返回按钮（置于遮罩与卡片之上） */}
      <Box sx={{ position: 'fixed', top: 16, left: 16, zIndex: 3 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => navigate('/')}
          sx={{
            color: '#1d4ed8',
            bgcolor: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '12px',
            boxShadow: '0 6px 18px rgba(30,64,175,0.18)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.85)',
            },
          }}
        >
          返回主页
        </Button>
      </Box>

      {/* 前景：登录/注册卡片 */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <App />
      </Box>
    </Box>
  );
};

export default AuthOverlay;
