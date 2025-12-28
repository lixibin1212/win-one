import React, { useState } from 'react';
import { Box, Paper, ThemeProvider, Typography, createTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TopNavBar } from '../shared/TopNavBar';
import { AiAnimationSubNav, AiAnimationSubSection } from './AiAnimationSubNav';
import { RoleImageGeneratorPanel } from './RoleImageGeneratorPanel';

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

export const AiAnimationPage: React.FC = () => {
  const navigate = useNavigate();
  const [sub, setSub] = useState<AiAnimationSubSection>('role');

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
            width: { xs: '95%', sm: '92%', md: '90%', lg: '88%', xl: '85%' },
            maxWidth: '1920px',
            mx: 'auto',
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {/* 顶部两项：ai动画制作 / ai视频剪辑 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 10, mb: 6 }}>
            <Typography sx={{ fontWeight: 900, color: '#f97316', cursor: 'default' }}>ai动画制作</Typography>
            <Typography
              sx={{ fontWeight: 900, color: '#94a3b8', cursor: 'pointer' }}
              onClick={() => navigate('/ai-video-edit')}
            >
              ai视频剪辑
            </Typography>
          </Box>

          {/* 红线下方：二级导航 */}
          <Box sx={{ mb: 3 }}>
            <AiAnimationSubNav value={sub} onChange={setSub} />
          </Box>

          {sub === 'role' ? (
            <Box sx={{ mb: 3 }}>
              <RoleImageGeneratorPanel />
            </Box>
          ) : (
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
              <Typography color="text.secondary">该功能稍后开放</Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};
