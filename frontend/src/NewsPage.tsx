import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  keyframes
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from './AuthContext';
import LogoCarousel from './LogoCarousel';

const waveMove = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(200%) skewX(-20deg); }
`;

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eff6ff' }}>
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
            inset: '-5%',
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%233b82f6' fill-opacity='0.15' d='M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,181.3C672,181,768,203,864,224C960,245,1056,267,1152,250.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3Cpath fill='%2360a5fa' fill-opacity='0.3' d='M0,224L48,213.3C96,203,181,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3Cpath fill='%23ffffff' fill-opacity='0.6' d='M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,245.3C672,256,768,256,864,245.3C960,235,1056,213,1152,208C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: `${waveMove} 20s ease-in-out infinite alternate`
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
            animation: `${shimmer} 8s infinite linear`,
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
            <Box display="flex" alignItems="center" gap={2}>
              <Button 
                onClick={() => navigate('/home')}
                sx={{ 
                  color: '#ffffff', 
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  transition: 'all 0.3s',
                  transform: location.pathname === '/home' ? 'scale(1.2)' : 'scale(1)',
                  textShadow: location.pathname === '/home' 
                    ? '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)' 
                    : '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  '&:hover': { 
                    bgcolor: 'transparent',
                    transform: 'scale(1.2)',
                    textShadow: '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)',
                  }
                }}
              >
                主页
              </Button>
              <Button 
                onClick={() => navigate('/news')}
                sx={{ 
                  color: '#ffffff', 
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  transition: 'all 0.3s',
                  transform: location.pathname === '/news' ? 'scale(1.2)' : 'scale(1)',
                  textShadow: location.pathname === '/news' 
                    ? '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)' 
                    : '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  '&:hover': { 
                    bgcolor: 'transparent',
                    transform: 'scale(1.2)',
                    textShadow: '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)',
                  }
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  优选
                  {location.pathname === '/news' && (
                    <AutoAwesomeIcon 
                      sx={{ 
                        position: 'absolute', 
                        bottom: -2, 
                        right: -14, 
                        fontSize: 14, 
                        color: '#ffd700',
                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                      }} 
                    />
                  )}
                </Box>
              </Button>
              <Button 
                onClick={() => navigate('/pricing')}
                sx={{ 
                  color: '#ffffff', 
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  transition: 'all 0.3s',
                  transform: location.pathname === '/pricing' ? 'scale(1.2)' : 'scale(1)',
                  textShadow: location.pathname === '/pricing' 
                    ? '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)' 
                    : '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  '&:hover': { 
                    bgcolor: 'transparent',
                    transform: 'scale(1.2)',
                    textShadow: '1px 1px 0 #000, 3px 3px 0px rgba(0,0,0,0.5)',
                  }
                }}
              >
                会员套餐
              </Button>
            </Box>

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

      {/* Main Content Area */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          flexGrow: 1,
          pt: 12, // Position it higher up
          minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
        }}
      >
        <LogoCarousel />
      </Box>
    </Box>
  );
};

export default NewsPage;
