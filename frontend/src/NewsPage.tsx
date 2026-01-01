import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Tooltip,
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
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
import { AiAnimationSubNav, AiAnimationSubSection } from './aiAnimation/AiAnimationSubNav';
import { RoleImageGeneratorPanel } from './aiAnimation/RoleImageGeneratorPanel';
import { ScriptAnalysisPanel } from './aiAnimation/ScriptAnalysisPanel';

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
  const [sub, setSub] = useState<AiAnimationSubSection>('role');
  const [scriptInstance, setScriptInstance] = useState(0);

  type RoleCard = {
    id: string;
    name: string;
    imageDataUrl: string | null;
    voice: string;
  };

  type VideoRow = {
    id: string;
    roleCards: RoleCard[];
  };

  const headers = useMemo(() => ['分镜脚本', '角色', '操作', '九宫格图像', '视频脚本', '生成视频', '操作'], []);
  const gridCols = useMemo(() => '1.05fr 1.55fr 0.55fr 1.05fr 1.05fr 1.25fr 0.55fr', []);
  const tableLine = 'rgba(15, 23, 42, 0.18)';
  const gridBorder = `2px solid ${tableLine}`;

  const makeRow = (id: string): VideoRow => ({
    id,
    roleCards: [{ id: `${id}-role-1`, name: '未命名', imageDataUrl: null, voice: '' }],
  });

  const nextRowId = useRef(3);
  const [rows, setRows] = useState<VideoRow[]>(() => [makeRow('row-1'), makeRow('row-2')]);

  const updateRow = (rowId: string, updater: (row: VideoRow) => VideoRow) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? updater(r) : r)));
  };

  const addRow = () => {
    setRows((prev) => {
      const id = `row-${nextRowId.current}`;
      nextRowId.current += 1;
      return [...prev, makeRow(id)];
    });
  };

  const deleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const addRoleCard = (rowId: string) => {
    updateRow(rowId, (row) => {
      if (row.roleCards.length >= 11) return row;
      const parseRoleNum = (id: string) => {
        const m = id.match(/-role-(\d+)$/);
        return m ? Number(m[1]) : 0;
      };
      const nextIdx = Math.max(0, ...row.roleCards.map((c) => parseRoleNum(c.id))) + 1;
      return {
        ...row,
        roleCards: [
          ...row.roleCards,
          { id: `${rowId}-role-${nextIdx}`, name: '未命名', imageDataUrl: null, voice: '' },
        ],
      };
    });
  };

  const deleteRoleCard = (rowId: string, roleId: string) => {
    updateRow(rowId, (row) => {
      if (row.roleCards.length <= 1) return row;
      return { ...row, roleCards: row.roleCards.filter((c) => c.id !== roleId) };
    });
  };

  const setRoleName = (rowId: string, roleId: string, name: string) => {
    updateRow(rowId, (row) => ({
      ...row,
      roleCards: row.roleCards.map((c) => (c.id === roleId ? { ...c, name } : c)),
    }));
  };

  const setRoleVoice = (rowId: string, roleId: string, voice: string) => {
    updateRow(rowId, (row) => ({
      ...row,
      roleCards: row.roleCards.map((c) => (c.id === roleId ? { ...c, voice } : c)),
    }));
  };

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setRoleImage = async (rowId: string, roleId: string, file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    updateRow(rowId, (row) => ({
      ...row,
      roleCards: row.roleCards.map((c) => (c.id === roleId ? { ...c, imageDataUrl: dataUrl } : c)),
    }));
  };

  const handleSubChange = (next: AiAnimationSubSection) => {
    if (sub === 'script' && next !== 'script') {
      setScriptInstance((v) => v + 1);
    }
    setSub(next);
  };

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
        {/* 保持 LogoCarousel 全宽，以保留两侧的背景/渐隐效果 */}
        <Box sx={{ width: '100%' }}>
          <LogoCarousel
            activeIndex={0}
            navigateOnSelect={false}
            persistKey="main"
            onSelect={(index) => {
              if (index === 1) navigate('/ai-video-edit');
            }}
          />
        </Box>

        {/* 图二红色区域：承载图一页面内容（走居中容器） */}
        <Box
          sx={{
            width: { xs: '98%', sm: '96%', md: '94%', lg: '92%', xl: '90%' },
            maxWidth: '1920px',
            mx: 'auto',
            px: { xs: 0.5, sm: 1, md: 2 },
          }}
        >
          <Box sx={{ mt: 10, mb: 3, width: '100%' }}>
            <AiAnimationSubNav value={sub} onChange={handleSubChange} />
          </Box>

          {sub === 'role' ? (
            <Box sx={{ mb: 3 }}>
              <RoleImageGeneratorPanel />
            </Box>
          ) : sub === 'script' ? (
            <Box sx={{ mb: 3 }}>
              <ScriptAnalysisPanel key={`script-${scriptInstance}`} />
            </Box>
          ) : (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  width: '100%',
                  minHeight: { xs: 220, md: 260 },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    borderLeft: gridBorder,
                    borderRight: gridBorder,
                    borderTop: gridBorder,
                    borderBottom: gridBorder,
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 表头 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, width: '100%' }}>
                    {headers.map((t, idx) => (
                      <Box
                        key={t}
                        sx={{
                          textAlign: 'center',
                          fontWeight: 900,
                          color: '#0f172a',
                          py: 2,
                          borderBottom: gridBorder,
                          borderRight: idx === headers.length - 1 ? 'none' : gridBorder,
                          bgcolor: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        {t}
                      </Box>
                    ))}
                  </Box>

                  {/* 行 */}
                  <Box sx={{ width: '100%' }}>
                    {rows.map((row, rowIdx) => {
                      const canDelete = rowIdx > 0;
                      const canAddRole = row.roleCards.length < 11;
                      const accent = '#ef4444';
                      const accentBorder = `2px solid ${accent}`;

                      return (
                        <Box
                          key={row.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: gridCols,
                            width: '100%',
                            minHeight: { xs: 150, md: 190 },
                            height: 'auto',
                            bgcolor: 'rgba(255, 255, 255, 0.35)',
                            borderBottom: rowIdx === rows.length - 1 ? 'none' : gridBorder,
                          }}
                        >
                          {/* 分镜脚本 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 角色 */}
                          <Box
                            sx={{
                              borderRight: gridBorder,
                              px: { xs: 0.9, md: 1.2 },
                              py: { xs: 1.1, md: 1.5 },
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1.2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.4 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  gap: 1.2,
                                  minHeight: 86,
                                  flex: '1 1 auto',
                                  minWidth: 0,
                                  pr: 1,
                                }}
                              >
                                {row.roleCards.map((card, cardIdx) => {
                                  const inputKey = `${row.id}:${card.id}`;
                                  const canDeleteRole = row.roleCards.length > 1;
                                  const roleNo = cardIdx + 1;
                                  return (
                                    <Box key={card.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.0 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.0, maxWidth: '100%' }}>
                                        <Typography
                                          sx={{
                                            fontWeight: 900,
                                            color: accent,
                                            flex: '0 0 auto',
                                            minWidth: 56,
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.1,
                                            textAlign: 'left',
                                            alignSelf: 'center',
                                          }}
                                        >
                                          角色{roleNo}:
                                        </Typography>

                                        <Box
                                          onClick={() => fileInputRefs.current[inputKey]?.click()}
                                          role="button"
                                          aria-label="上传角色图片"
                                          sx={{
                                            width: 56,
                                            height: 64,
                                            borderRadius: 1,
                                            border: accentBorder,
                                            bgcolor: '#fff',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            flex: '0 0 auto',
                                          }}
                                        >
                                          <input
                                            ref={(el) => {
                                              fileInputRefs.current[inputKey] = el;
                                            }}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              await setRoleImage(row.id, card.id, file);
                                              e.target.value = '';
                                            }}
                                          />
                                          {card.imageDataUrl ? (
                                            <Box
                                              component="img"
                                              src={card.imageDataUrl}
                                              alt=""
                                              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                          ) : (
                                            <Box sx={{ width: '100%', height: '100%' }} />
                                          )}
                                        </Box>

                                        <Box
                                          sx={{
                                            width: 76,
                                            height: 30,
                                            borderRadius: 1,
                                            border: accentBorder,
                                            bgcolor: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            px: 0.5,
                                            flex: '0 0 auto',
                                          }}
                                        >
                                          <InputBase
                                            value={card.name}
                                            onChange={(e) => setRoleName(row.id, card.id, e.target.value)}
                                            sx={{
                                              fontSize: 12,
                                              fontWeight: 800,
                                              width: '100%',
                                              '& input': { textAlign: 'center', p: 0 },
                                            }}
                                          />
                                        </Box>

                                        <IconButton
                                          size="small"
                                          onClick={() => deleteRoleCard(row.id, card.id)}
                                          disabled={!canDeleteRole}
                                          sx={{
                                            width: 38,
                                            height: 28,
                                            borderRadius: 1,
                                            border: accentBorder,
                                            color: accent,
                                            bgcolor: '#fff',
                                            flex: '0 0 auto',
                                          }}
                                        >
                                          <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>-</Typography>
                                        </IconButton>
                                      </Box>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.0 }}>
                                        <Typography
                                          sx={{
                                            fontWeight: 900,
                                            color: accent,
                                            flex: '0 0 auto',
                                            minWidth: 56,
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.1,
                                          }}
                                        >
                                          音色:
                                        </Typography>
                                        <Box
                                          sx={{
                                            height: 34,
                                            borderRadius: 1,
                                            border: accentBorder,
                                            bgcolor: '#fff',
                                            px: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            flex: '1 1 auto',
                                            minWidth: 0,
                                            maxWidth: 260,
                                          }}
                                        >
                                          <InputBase
                                            value={card.voice}
                                            onChange={(e) => setRoleVoice(row.id, card.id, e.target.value)}
                                            sx={{ width: '100%', fontSize: 13, '& input': { p: 0 } }}
                                          />
                                        </Box>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1.1,
                                  pt: 0.2,
                                  flex: '0 0 auto',
                                  zIndex: 2,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => addRoleCard(row.id)}
                                  disabled={!canAddRole}
                                  sx={{
                                    width: 38,
                                    height: 28,
                                    borderRadius: 1,
                                    border: accentBorder,
                                    color: accent,
                                    bgcolor: '#fff',
                                  }}
                                >
                                  <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>+</Typography>
                                </IconButton>
                              </Box>
                            </Box>

                            {/* 音色已改为每个角色单独一行 */}
                          </Box>

                          {/* 操作（左） */}
                          <Box
                            sx={{
                              borderRight: gridBorder,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'center',
                              pt: 3.2,
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6, alignItems: 'center' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 72, fontWeight: 800, borderWidth: 2, borderColor: accent, color: accent }}
                              >
                                生成
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 72, fontWeight: 800, borderWidth: 2, borderColor: accent, color: accent }}
                              >
                                重新生成
                              </Button>
                            </Box>
                          </Box>

                          {/* 九宫格图像 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 视频脚本 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 生成视频 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 操作（右） */}
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 72, fontWeight: 800, borderWidth: 2, borderColor: accent, color: accent }}
                              >
                                生成
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 72, fontWeight: 800, borderWidth: 2, borderColor: accent, color: accent }}
                              >
                                重新生成
                              </Button>
                              {canDelete ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => deleteRow(row.id)}
                                  sx={{
                                    minWidth: 72,
                                    fontWeight: 800,
                                    borderWidth: 2,
                                    borderColor: accent,
                                    color: accent,
                                  }}
                                >
                                  删除行
                                </Button>
                              ) : (
                                <Box sx={{ height: 30 }} />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Paper>

              {/* 容器外边底部的按钮：只保留图标（无白色方块底） */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Tooltip title="增加视频栏" placement="top">
                  <Box
                    role="button"
                    aria-label="增加视频栏"
                    onClick={addRow}
                    sx={{
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover img': { opacity: 0.85 },
                    }}
                  >
                    <Box
                      component="img"
                      src={`${process.env.PUBLIC_URL || ''}/add.svg`}
                      alt="add"
                      sx={{ width: 18, height: 18, display: 'block' }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NewsPage;
