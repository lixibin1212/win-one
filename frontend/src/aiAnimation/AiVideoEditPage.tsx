import React from 'react';
import { Box, Paper, ThemeProvider, Typography, createTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TopNavBar } from '../shared/TopNavBar';
import LogoCarousel from '../LogoCarousel';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    background: { default: '#f5f8fc' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif',
  },
});

export const AiVideoEditPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#eff6ff',
        }}
      >
        <TopNavBar />

        {/* Main Content Area：与 NewsPage 保持一致的垂直节奏 */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexGrow: 1,
            pt: 12,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {/* 顶部选择区：全宽（保留两侧虚化/渐隐效果） */}
          <Box sx={{ width: '100%' }}>
            <LogoCarousel
              activeIndex={1}
              navigateOnSelect={false}
              persistKey="main"
              onSelect={(index) => {
                if (index === 0) navigate('/news');
              }}
            />
          </Box>

          {/* 下方内容区：仅替换这一小部分 */}
          <Box
            sx={{
              width: { xs: '95%', sm: '92%', md: '90%', lg: '88%', xl: '85%' },
              maxWidth: '1920px',
              mx: 'auto',
              px: { xs: 1, sm: 2, md: 3 },
              mt: 10,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 6,
                bgcolor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>敬请期待</Typography>
              <Typography color="text.secondary">ai视频剪辑功能稍后开放</Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
