import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  keyframes
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from './AuthContext';

// 1. 太阳自转动画
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 2. 星星闪烁动画
const twinkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
`;

// 3. 彩虹生长动画
const rainbowDraw = keyframes`
  from { stroke-dashoffset: 300; }
  to { stroke-dashoffset: 0; }
`;

// 4. 星星从小变大闪烁动画
const growFade = keyframes`
  0% { transform: scale(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
`;

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      title: 'Free',
      price: 0,
      period: '月',
      description: '享有以下权益',
      features: [
        '一次性10积分',
        '仅基础视频代理功能，TikTok广告库有限访问',
        '最大视频代理长度：15秒',
        '一次性10秒Avatar 4试用',
        '100+ 数字人和AI配音',
        '1个自定义数字人',
        '1个已保存的产品数字人',
        '付费音色克隆',
        '5GB存储空间',
        '包含水印'
      ],
      buttonText: '当前套餐',
      buttonVariant: 'outlined' as const,
      highlight: false
    },
    {
      title: 'Pro',
      price: 16.5,
      originalPrice: 240,
      yearlyPrice: 198,
      save: 42,
      period: '月',
      description: 'Free套餐包含的所有内容，此外：',
      features: [
        '960 积分/年，按年过期',
        '365天免费Banana Pro',
        '完整视频代理功能，TikTok广告库完全访问',
        '最大视频代理长度：15秒',
        'Avatar 4更长时长',
        '2000+ 数字人和配音',
        '免费自定义头像创建，最多可保存200 个头像',
        '无限保存产品数字人',
        '5个免费语音克隆，然后每个克隆2积分',
        '50GB 存储空间',
        '无水印',
        '更快的渲染速度'
      ],
      buttonText: '获取年付套餐',
      buttonVariant: 'contained' as const,
      highlight: false,
      crown: true
    },
    {
      title: 'Enterprise',
      customPrice: '让我们谈谈',
      description: '',
      features: [
        '自定义团队席位',
        '自定义积分额度',
        '自定义数字人',
        '自定义AI音色',
        '自定义功能'
      ],
      buttonText: '联系我们',
      buttonVariant: 'contained' as const,
      highlight: false
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #dbeafe 0%, #ffffff 100%)',
      color: '#1e293b', 
      pb: 8 
    }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2, color: '#000000' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#000000', fontWeight: 700 }}>
            Vwin
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* 顶部动画区域 */}
        <Box sx={{ position: 'relative', height: '120px', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: { xs: 2, md: 10 } }}>
          
          {/* 左侧红框：太阳与星星 (银色带点黄) */}
          <Box sx={{ width: '200px', height: '100%', position: 'relative' }}>
             {/* 太阳 */}
             <Box sx={{ position: 'absolute', top: '20%', left: '20%', width: 60, height: 60 }}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                   <defs>
                      <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                         <stop offset="0%" stopColor="#ffffff" />
                         <stop offset="100%" stopColor="#fef08a" />
                      </radialGradient>
                   </defs>
                   {/* 核心 */}
                   <circle cx="50" cy="50" r="25" fill="url(#sunGrad)" filter="drop-shadow(0 0 5px rgba(255,255,255,0.8))" />
                   {/* 光芒外圈 - 自转 */}
                   <g style={{ animation: `${rotate} 10s linear infinite`, transformOrigin: '50px 50px' }}>
                      {[...Array(8)].map((_, i) => (
                         <path 
                           key={i}
                           d="M50 10 L55 30 L50 35 L45 30 Z" 
                           fill="#fef08a" 
                           transform={`rotate(${i * 45} 50 50)`}
                           opacity="0.8"
                         />
                      ))}
                   </g>
                </svg>
             </Box>
             {/* 四角星星 - 闪烁 */}
             {[
               { top: '10%', left: '60%', size: 20, delay: '0s' },
               { top: '60%', left: '10%', size: 15, delay: '1s' },
               { top: '50%', left: '80%', size: 25, delay: '0.5s' }
             ].map((star, i) => (
                <Box key={i} sx={{ position: 'absolute', top: star.top, left: star.left, width: star.size, height: star.size, animation: `${twinkle} 2s ease-in-out infinite`, animationDelay: star.delay }}>
                   <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <path d="M50 0 C55 40 60 45 100 50 C60 55 55 60 50 100 C45 60 40 55 0 50 C40 45 45 40 50 0 Z" fill="#ffffff" filter="drop-shadow(0 0 2px #fef08a)" />
                   </svg>
                </Box>
             ))}
          </Box>

          {/* 中间红框：彩虹 (半圈生长) */}
          <Box sx={{ width: '200px', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', pb: 1 }}>
             <svg viewBox="0 0 200 100" width="180" height="90" style={{ overflow: 'visible' }}>
                <defs>
                   <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff9a9e" />
                      <stop offset="25%" stopColor="#fad0c4" />
                      <stop offset="50%" stopColor="#a18cd1" />
                      <stop offset="75%" stopColor="#fbc2eb" />
                      <stop offset="100%" stopColor="#8fd3f4" />
                   </linearGradient>
                </defs>
                {/* 背景轨道 (可选) */}
                <path d="M10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" strokeLinecap="round" />
                {/* 动态彩虹 */}
                <path 
                  d="M10 100 A 90 90 0 0 1 190 100" 
                  fill="none" 
                  stroke="url(#rainbowGrad)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  style={{ 
                    strokeDasharray: 300, 
                    strokeDashoffset: 300, 
                    animation: `${rainbowDraw} 2.5s ease-out forwards` 
                  }} 
                />
             </svg>
          </Box>

          {/* 右侧红框：星星从小变大 (重复) */}
          <Box sx={{ width: '200px', height: '100%', position: 'relative' }}>
             {[
               { top: '30%', left: '30%', size: 30, delay: '0s' },
               { top: '60%', left: '60%', size: 20, delay: '1.5s' },
               { top: '20%', left: '70%', size: 25, delay: '0.8s' },
               { top: '70%', left: '20%', size: 15, delay: '2.2s' }
             ].map((star, i) => (
                <Box key={i} sx={{ position: 'absolute', top: star.top, left: star.left, width: star.size, height: star.size, animation: `${growFade} 3s ease-in-out infinite`, animationDelay: star.delay, opacity: 0 }}>
                   <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <path d="M50 0 C55 40 60 45 100 50 C60 55 55 60 50 100 C45 60 40 55 0 50 C40 45 45 40 50 0 Z" fill="#ffffff" filter="drop-shadow(0 0 3px #fef08a)" />
                   </svg>
                </Box>
             ))}
          </Box>

        </Box>

        {/* Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6, alignItems: 'center' }}>
          <Box
            sx={{
              bgcolor: '#1f2937',
              borderRadius: '100px',
              p: 0.5,
              display: 'flex',
              position: 'relative'
            }}
          >
            <Button
              onClick={() => setIsYearly(false)}
              sx={{
                borderRadius: '100px',
                px: 4,
                py: 1,
                color: !isYearly ? 'black' : 'gray',
                bgcolor: !isYearly ? 'white' : 'transparent',
                '&:hover': { bgcolor: !isYearly ? 'white' : 'rgba(255,255,255,0.1)' }
              }}
            >
              月付
            </Button>
            <Button
              onClick={() => setIsYearly(true)}
              sx={{
                borderRadius: '100px',
                px: 4,
                py: 1,
                color: isYearly ? 'black' : 'gray',
                bgcolor: isYearly ? 'white' : 'transparent',
                '&:hover': { bgcolor: isYearly ? 'white' : 'rgba(255,255,255,0.1)' }
              }}
            >
              年付
              <Chip
                label="最高节省 43%"
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: 'transparent',
                  color: '#6366f1',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  height: 'auto',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            </Button>
          </Box>
          

        </Box>

        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  bgcolor: '#111827',
                  color: 'white',
                  borderRadius: 4,
                  border: plan.highlight ? '2px solid #6366f1' : '1px solid #374151',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.highlight ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                {plan.highlight && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)'
                    }}
                  />
                )}

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {plan.crown && <span style={{ color: '#fbbf24' }}>👑</span>}
                  {plan.title}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  {plan.customPrice ? (
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{plan.customPrice}</Typography>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>${plan.price}</Typography>
                        <Typography variant="subtitle1" sx={{ color: 'gray', ml: 1 }}>USD / {plan.period}</Typography>
                      </Box>
                      {isYearly && plan.yearlyPrice && (
                        <Typography variant="caption" sx={{ color: 'gray', display: 'block', mt: 1 }}>
                          ${plan.yearlyPrice}(${plan.originalPrice} - ${plan.save}) 费用每年
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                {/* Slider placeholder for Pro */}
                {plan.title === 'Pro' && (
                   <Box sx={{ mb: 3 }}>
                      <Box sx={{ height: 4, bgcolor: '#374151', borderRadius: 2, position: 'relative' }}>
                         <Box sx={{ position: 'absolute', left: 0, width: '20%', height: '100%', bgcolor: '#6366f1', borderRadius: 2 }} />
                         <Box sx={{ position: 'absolute', left: '20%', top: '50%', width: 16, height: 16, bgcolor: 'white', border: '4px solid #6366f1', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                         <Typography variant="caption" color="gray">1x</Typography>
                         <Typography variant="caption" color="gray">5x</Typography>
                      </Box>
                   </Box>
                )}

                <Button
                  variant={plan.buttonVariant}
                  fullWidth
                  sx={{
                    mb: 4,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: plan.buttonVariant === 'contained' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: plan.buttonVariant === 'contained' ? '#4f46e5' : 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {plan.buttonText}
                </Button>

                <Typography variant="body2" sx={{ mb: 2, color: 'gray' }}>
                  {plan.description}
                </Typography>

                <List dense sx={{ flexGrow: 1 }}>
                  {plan.features.map((feature, idx) => (
                    <ListItem key={idx} disableGutters sx={{ alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        <CheckIcon sx={{ color: 'gray', fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ variant: 'body2', color: 'gray' }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PricingPage;
