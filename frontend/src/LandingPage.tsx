import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container, Paper, Chip, Divider, keyframes } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';

const borderRotate = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg,#f8fbff 0%,#f3f7fd 40%,#ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Large gradient background orb */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '1400px',
          height: '1400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.6) 0%, rgba(147, 197, 253, 0.3) 40%, rgba(147, 197, 253, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />

      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: { xs: '20px 32px', md: '24px 80px' },
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#000000',
            letterSpacing: '0.5px',
            fontSize: { xs: '16px', md: '18px' },
          }}
        >
          APPLIED LABS
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 6, alignItems: 'center' }}>
          <Typography sx={{ color: '#1f2937', cursor: 'pointer', fontSize: '15px', fontWeight: 400, '&:hover': { color: '#000000' }, transition: 'color 0.2s' }}>
            Assurance
          </Typography>
          <Typography sx={{ color: '#1f2937', cursor: 'pointer', fontSize: '15px', fontWeight: 400, '&:hover': { color: '#000000' }, transition: 'color 0.2s' }}>
            Blog
          </Typography>
          <Typography sx={{ color: '#1f2937', cursor: 'pointer', fontSize: '15px', fontWeight: 400, '&:hover': { color: '#000000' }, transition: 'color 0.2s' }}>
            Company
          </Typography>
          <Typography onClick={() => navigate('/login')} sx={{ color: '#1f2937', cursor: 'pointer', fontSize: '15px', fontWeight: 400, '&:hover': { color: '#000000' }, transition: 'color 0.2s' }}>
            Sign In
          </Typography>
          <Button
            onClick={() => navigate('/login')}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb) padding-box, linear-gradient(90deg, #FF0080, #00FFFF, #00FF00, #FFD700, #FF0080) border-box',
              border: '3px solid transparent',
              color: 'white',
              borderRadius: '100px',
              padding: '6px 24px',
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
              transition: 'background-position 2s linear, box-shadow 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8) padding-box, linear-gradient(90deg, #FF0080, #00FFFF, #00FF00, #FFD700, #FF0080) border-box',
                backgroundSize: '200% 100%',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                backgroundPosition: '100% 50%',
              },
            }}
          >
            Get Demo
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          py: { xs: 10, md: 0 },
        }}
      >
        {/* Hero 主标题 */}
        <Box sx={{ maxWidth: 1100 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '46px', sm: '60px', md: '76px', lg: '84px' },
              fontWeight: 600,
              color: '#0f172a',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            AI Agents That
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '46px', sm: '60px', md: '76px', lg: '84px' },
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            <Box component="span" sx={{
              background: 'linear-gradient(90deg,#2563eb 0%,#3b82f6 50%,#0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>Understand</Box>, Support, and Retain Customers
          </Typography>
        </Box>
        {/* 副标题描述 */}
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '17px', md: '20px' },
            color: '#475569',
            mt: { xs: 4, md: 5 },
            mb: { xs: 4, md: 6 },
            maxWidth: 760,
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          Handle complex conversations across chat, email and voice at <Box component="span" sx={{ fontWeight: 600, color: '#0f172a' }}>95%+ CSAT</Box>.
          <Box component="span" sx={{ display: 'block', mt: 1 }}>Managed in one easy-to-use platform.</Box>
        </Typography>
        {/* CTA 区域 */}
        <Box display="flex" justifyContent="center">
          <Button
            onClick={() => navigate('/login')}
            variant="contained"
            sx={{
              // 去掉边界线（仅此按钮），保留主体填充渐变
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              borderRadius: '100px',
              px: { xs: 3, md: 4 },
              py: { xs: 0.5, md: 0.6 },
              fontSize: { xs: '15px', md: '16px' },
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 50%',
              transition: 'background-position 2s linear, box-shadow 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                backgroundSize: '200% 100%',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                backgroundPosition: '100% 50%',
              },
            }}
          >
            Get Demo
          </Button>
        </Box>
        {/* 信任标语 */}
        <Chip icon={<StarIcon />} label="Trusted by thousands of customers" sx={{ mt: 6, bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 500 }} />
      </Container>

      {/* 品牌与团队区块 */}
      <Box sx={{ py: { xs: 10, md: 12 }, px: { xs: 3, md: 8 }, position: 'relative' }}>
        <Container maxWidth="lg">
          <Divider sx={{ mb: 6, opacity: 0.4 }} />
          <Box display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
            {[1,2,3,4,5,6].map(n => (
              <Box key={n} sx={{ flex: { xs: '1 1 calc(50% - 32px)', sm: '1 1 calc(33.33% - 32px)', md: '1 1 calc(16.66% - 32px)' }, minWidth: 140 }}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#ffffff', border: '1px solid #e2e8f0', '&:hover': { boxShadow: '0 8px 24px -8px rgba(37,99,235,0.25)' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2563eb' }}>Brand {n}</Typography>
                </Paper>
              </Box>
            ))}
          </Box>
          <Box mt={8} display="flex" justifyContent="center">
            <Chip icon={<SchoolIcon />} label="Led by alumni of leading global technology and academic organizations" sx={{ maxWidth: 680, whiteSpace: 'normal', lineHeight: 1.4, bgcolor: '#f1f5f9', fontSize: { xs: 12, md: 13 } }} />
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
