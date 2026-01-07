import React from 'react';
import { Box, ThemeProvider, Typography, createTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TopNavBar } from '../shared/TopNavBar';
import { AiVideoEditPage } from './AiVideoEditPage';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#10b981' },
    background: { default: '#f5f8fc' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif',
  },
});

export const AiVideoEditShellPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f8fafc',
          background: `
            radial-gradient(circle at 15% 15%, rgba(219, 234, 254, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 50% 0%, rgba(239, 246, 255, 0.5) 0%, transparent 60%),
            linear-gradient(to bottom, #f0f9ff 0%, #f8fafc 100%)
          `,
          pb: 4,
        }}
      >
        <TopNavBar />

        <Box
          sx={{
            mt: 4,
            width: { xs: '98%', sm: '96%', md: '94%', lg: '92%', xl: '90%' },
            maxWidth: '1920px',
            mx: 'auto',
            px: { xs: 0.5, sm: 1, md: 2 },
          }}
        >
          {/* 顶部两项：ai动画制作 / ai视频剪辑（样式对齐 AiAnimationPage） */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 10, mb: 6 }}>
            <Typography
              sx={{ fontWeight: 900, color: '#94a3b8', cursor: 'pointer' }}
              onClick={() => navigate('/ai-animation')}
            >
              ai动画制作
            </Typography>
            <Typography sx={{ fontWeight: 900, color: '#f97316', cursor: 'default' }}>ai视频剪辑</Typography>
          </Box>

          {/* 下方：只替换为视频编辑的工作台 + 结果生成区域 */}
          <Box sx={{ mb: 3 }}>
            <AiVideoEditPage embedded />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
