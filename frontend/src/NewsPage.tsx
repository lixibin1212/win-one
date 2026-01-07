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
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import LogoCarousel from './LogoCarousel';
import { AiAnimationSubNav, AiAnimationSubSection } from './aiAnimation/AiAnimationSubNav';
import { RoleImageGeneratorPanel } from './aiAnimation/RoleImageGeneratorPanel';
import { ScriptAnalysisPanel } from './aiAnimation/ScriptAnalysisPanel';
import { AiVideoEditPage } from './aiAnimation/AiVideoEditPage';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const waveMove = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(200%) skewX(-20deg); }
`;

const dotJump = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
  30% { transform: translateY(-5px); opacity: 1; }
`;

const NewsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [topTab, setTopTab] = useState<'animation' | 'video'>('animation');
  const [sub, setSub] = useState<AiAnimationSubSection>('role');
  const [scriptInstance, setScriptInstance] = useState(0);
  const [sendToAnimationLoading, setSendToAnimationLoading] = useState(false);
  const [sendToAnimationError, setSendToAnimationError] = useState<string | null>(null);

  type RoleCard = {
    id: string;
    name: string;
    imageDataUrl: string | null;
    voice: string;
  };

  type VideoRow = {
    id: string;
    roleCards: RoleCard[];
    storyboardScript: string;
    videoScript: string;
  };

  const headers = useMemo(() => ['分镜脚本', '角色', '操作', '九宫格图像', '视频脚本', '生成视频', '操作'], []);
  const gridCols = useMemo(
    () =>
      'minmax(0, 1.05fr) minmax(0, 1.55fr) minmax(0, 0.55fr) minmax(0, 1.05fr) minmax(0, 1.05fr) minmax(0, 1.25fr) minmax(0, 0.55fr)',
    []
  );
  const tableLine = 'rgba(15, 23, 42, 0.18)';
  const gridBorder = `2px solid ${tableLine}`;

  const makeRow = (id: string): VideoRow => ({
    id,
    roleCards: [{ id: `${id}-role-1`, name: '未命名', imageDataUrl: null, voice: '' }],
    storyboardScript: '',
    videoScript: '',
  });

  const nextRowId = useRef(3);
  const [rows, setRows] = useState<VideoRow[]>(() => [makeRow('row-1'), makeRow('row-2')]);

  const [rowLoading, setRowLoading] = useState<Record<string, { roles?: boolean; video?: boolean }>>({});
  const [rowError, setRowError] = useState<Record<string, { roles?: string; video?: string }>>({});
  const [rowRoleExpanded, setRowRoleExpanded] = useState<Record<string, boolean>>({});

  const setRowLoadingFlag = (rowId: string, key: 'roles' | 'video', value: boolean) => {
    setRowLoading((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: value,
      },
    }));
  };

  const setRowErrorText = (rowId: string, key: 'roles' | 'video', text: string | undefined) => {
    setRowError((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: text,
      },
    }));
  };

  const toggleRowRoleExpanded = (rowId: string) => {
    setRowRoleExpanded((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const JumpingDots: React.FC<{ color?: string }> = ({ color }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'flex-end', gap: 0.45, lineHeight: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          component="span"
          sx={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            bgcolor: color || 'currentColor',
            display: 'inline-block',
            animation: `${dotJump} 900ms ease-in-out infinite`,
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </Box>
  );

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
        roleCards: [...row.roleCards, { id: `${rowId}-role-${nextIdx}`, name: '未命名', imageDataUrl: null, voice: '' }],
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

  const setStoryboardScript = (rowId: string, storyboardScript: string) => {
    updateRow(rowId, (row) => ({ ...row, storyboardScript }));
  };

  const setVideoScript = (rowId: string, videoScript: string) => {
    updateRow(rowId, (row) => ({ ...row, videoScript }));
  };

  const buildAuthHeaders = (withJson: boolean): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (withJson) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const streamTextPost = async (path: string, body: unknown, onChunk?: (chunk: string) => void): Promise<string> => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `请求失败（HTTP ${res.status}）`);
    }

    if (!res.body) {
      const text = await res.text().catch(() => '');
      if (onChunk && text) onChunk(text);
      return text;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) continue;
      full += chunk;
      onChunk?.(chunk);
    }
    return full;
  };

  type ExtractedRole = {
    name: string;
    voiceRaw: string;
    voiceType?: string;
    speed?: string;
    tone?: string;
    volume?: string;
  };

  const extractRolesFromAnalysis = (analysisText: string): ExtractedRole[] => {
    const text = (analysisText || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\*\*/g, '');
    const matches: Array<{ index: number; full: string; name: string }> = [];
    // 只把“行首的【角色名】”当作角色分段，避免正文里出现【】导致串位
    const re = /(^|\n)([ \t]*)【([^】\n]+)】/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const leadingNewline = m[1] || '';
      const leadingSpaces = m[2] || '';
      const name = (m[3] || '').trim();
      const index = (m.index ?? 0) + leadingNewline.length + leadingSpaces.length;
      const full = `【${name}】`;
      matches.push({ index, full, name });
    }
    if (!matches.length) return [];

    const roles: ExtractedRole[] = [];
    for (let i = 0; i < matches.length; i += 1) {
      const name = matches[i]?.name || '';
      const start = (matches[i].index ?? 0) + matches[i].full.length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const section = text.slice(start, end);

      // 现在提示词只要求“音色设计”，因此音色格子只保留该部分内容
      const norm = section.trim();
      const idx1 = norm.search(/(?:①\s*)?音色设计\s*[:：]/);
      const voiceRaw = (idx1 >= 0 ? norm.slice(idx1) : norm)
        .replace(/^[-*\s]+/gm, '')
        .trim();

      const getParam = (key: string) => {
        const m = voiceRaw.match(new RegExp(`${key}\\s*(?:=|[:：])\\s*([^;；\n]+)`, 'i'));
        return m?.[1]?.trim();
      };

      const role: ExtractedRole = {
        name,
        voiceRaw,
        voiceType: getParam('音色类型'),
        speed: getParam('语速'),
        tone: getParam('语气'),
        volume: getParam('音量'),
      };

      roles.push(role);
    }
    return roles.filter((r) => r.name);
  };

  const applyRolesToRow = (rowId: string, roles: ExtractedRole[]) => {
    if (!roles.length) return;
    updateRow(rowId, (row) => {
      const nextRoleCards = row.roleCards.slice();

      const parseRoleNum = (id: string) => {
        const m = id.match(/-role-(\d+)$/);
        return m ? Number(m[1]) : 0;
      };
      let nextIdx = Math.max(0, ...nextRoleCards.map((c) => parseRoleNum(c.id))) + 1;

      while (nextRoleCards.length < roles.length && nextRoleCards.length < 11) {
        nextRoleCards.push({ id: `${rowId}-role-${nextIdx}`, name: '未命名', imageDataUrl: null, voice: '' });
        nextIdx += 1;
      }

      for (let i = 0; i < Math.min(roles.length, nextRoleCards.length); i += 1) {
        const role = roles[i];
        const voice = role.voiceRaw || '';
        nextRoleCards[i] = { ...nextRoleCards[i], name: role.name || nextRoleCards[i].name, voice };
      }

      return { ...row, roleCards: nextRoleCards };
    });
  };

  const applyAllToFirstEmptyRow = (payload: { storyboardScript: string; roles: ExtractedRole[]; videoScript: string }): string => {
    const { storyboardScript, roles, videoScript } = payload;
    const isEmpty = (s: string) => !String(s || '').trim();

    // 先基于当前 rows 选择目标行（避免依赖 setState updater 的副作用返回值）
    let chosenId: string | undefined = rows.find((r, idx) => idx === 0 && isEmpty(r.storyboardScript))?.id;
    if (!chosenId) chosenId = rows.find((r) => isEmpty(r.storyboardScript))?.id;
    const finalId = chosenId || `row-${nextRowId.current}`;
    if (!chosenId) nextRowId.current += 1;

    setRows((prev) => {
      const next = prev.slice();
      let idx = next.findIndex((r) => r.id === finalId);
      if (idx < 0) {
        next.push(makeRow(finalId));
        idx = next.length - 1;
      }
      const base = next[idx];
      let nextRoleCards = base.roleCards.slice();

      // 自动补足角色卡到最多 11 个
      const parseRoleNum = (id: string) => {
        const m = id.match(/-role-(\d+)$/);
        return m ? Number(m[1]) : 0;
      };
      let nextIdx = Math.max(0, ...nextRoleCards.map((c) => parseRoleNum(c.id))) + 1;
      while (nextRoleCards.length < roles.length && nextRoleCards.length < 11) {
        nextRoleCards.push({ id: `${finalId}-role-${nextIdx}`, name: '未命名', imageDataUrl: null, voice: '' });
        nextIdx += 1;
      }
      for (let i = 0; i < Math.min(roles.length, nextRoleCards.length); i += 1) {
        const role = roles[i];
        nextRoleCards[i] = { ...nextRoleCards[i], name: role.name || nextRoleCards[i].name, voice: role.voiceRaw || '' };
      }

      next[idx] = {
        ...base,
        storyboardScript,
        roleCards: nextRoleCards,
        videoScript,
      };
      return next;
    });

    return finalId;
  };

  const runRoleVoiceAnalysis = async (tweetText: string): Promise<ExtractedRole[]> => {
    const full = await streamTextPost('/api/proxy/xgai/role-voice-analyze', { tweet_text: tweetText });
    return extractRolesFromAnalysis(full);
  };

  const runVideoScriptGenerate = async (rowId: string, firstRole: ExtractedRole | null) => {
    const name = firstRole?.name || '角色1';
    const voiceType = firstRole?.voiceType || '';
    const speed = firstRole?.speed || '中速';
    const tone = firstRole?.tone || '沉稳';
    const volume = firstRole?.volume || '中';

    let accum = '';
    await streamTextPost(
      '/api/proxy/xgai/video-script-generate',
      { role_name: name, voice_type: voiceType, speed, tone, volume },
      (chunk) => {
      accum += chunk;
      setVideoScript(rowId, accum);
      }
    );
  };

  const handleSendToAnimation = async (payload: { tweetText: string; storyboardScript: string }) => {
    const storyboard = payload.storyboardScript;
    if (!storyboard.trim()) return;
    if (sendToAnimationLoading) return;

    setSendToAnimationLoading(true);
    setSendToAnimationError(null);

    try {
      const roles = await runRoleVoiceAnalysis(payload.tweetText);
      if (!roles.length) {
        throw new Error('未解析到任何【角色名称】段，请检查角色分析输出格式');
      }
      const firstRole = roles[0] || null;

      // 等到完整视频脚本生成完毕后，再跳转并一次性写入（满足“等待结果再跳转”）
      const name = firstRole?.name || '角色1';
      const voiceType = firstRole?.voiceType || '';
      const speed = firstRole?.speed || '中速';
      const tone = firstRole?.tone || '沉稳';
      const volume = firstRole?.volume || '中';

      const videoScript = await streamTextPost('/api/proxy/xgai/video-script-generate', {
        role_name: name,
        voice_type: voiceType,
        speed,
        tone,
        volume,
      });

      // 结果齐全后：对“第一空行”一次性写入 + 跳转到动画制作
      applyAllToFirstEmptyRow({ storyboardScript: storyboard, roles, videoScript });
      setSub('animation');
    } catch (e) {
      const msg = String((e as Error)?.message || e || '');
      const isAuth = /401|unauthorized|forbidden|403/i.test(msg);
      setSendToAnimationError(
        isAuth ? '未登录或登录已过期（请先登录）' : msg || '接口失败（请确认后端在运行且已配置 Key）'
      );
    } finally {
      setSendToAnimationLoading(false);
    }
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
            activeIndex={topTab === 'animation' ? 0 : 1}
            navigateOnSelect={false}
            persistKey="main"
            onSelect={(index) => {
              if (index === 0) setTopTab('animation');
              if (index === 1) setTopTab('video');
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
          {topTab === 'video' ? (
            <Box sx={{ mt: 10, mb: 3, width: '100%' }}>
              <AiVideoEditPage embedded />
            </Box>
          ) : (
            <>
              <Box sx={{ mt: 10, mb: 3, width: '100%' }}>
                <AiAnimationSubNav value={sub} onChange={handleSubChange} />
              </Box>

              {sub === 'role' ? (
                <Box sx={{ mb: 3 }}>
                  <RoleImageGeneratorPanel />
                </Box>
              ) : sub === 'script' ? (
                <Box sx={{ mb: 3 }}>
                  <ScriptAnalysisPanel
                    key={`script-${scriptInstance}`}
                    onSendToAnimation={handleSendToAnimation}
                    sendToAnimationLoading={sendToAnimationLoading}
                    sendToAnimationError={sendToAnimationError}
                  />
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
                      const isRolesLoading = Boolean(rowLoading[row.id]?.roles);
                      const isVideoLoading = Boolean(rowLoading[row.id]?.video);
                      const rolesError = rowError[row.id]?.roles;
                      const videoError = rowError[row.id]?.video;
                      const isRoleExpanded = Boolean(rowRoleExpanded[row.id]);
                      const accent = theme.palette.primary.main;
                      const primaryBtnSx = {
                        minWidth: 86,
                        height: 34,
                        px: 2.2,
                        fontWeight: 900,
                        borderRadius: '8px',
                        textTransform: 'none',
                        letterSpacing: '0.02em',
                        boxShadow: 'none',
                        background: accent,
                        '&:hover': {
                          background: alpha(accent, 0.9),
                          boxShadow: 'none',
                        },
                        '&:active': {
                          transform: 'translateY(0.5px)',
                        },
                      } as const;

                      const secondaryBtnSx = {
                        minWidth: 86,
                        height: 34,
                        px: 2.2,
                        fontWeight: 800,
                        borderRadius: '10px',
                        textTransform: 'none',
                        letterSpacing: '0.02em',
                        border: '1.5px solid',
                        borderColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#1e293b',
                        bgcolor: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 247, 255, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: `
                          0 2px 8px rgba(59, 130, 246, 0.15),
                          0 4px 16px rgba(59, 130, 246, 0.1),
                          inset 0 1px 0 rgba(255, 255, 255, 0.8)
                        `,
                        position: 'relative',
                        overflow: 'visible',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: '-1.5px',
                          borderRadius: '10px',
                          padding: '1.5px',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(147, 197, 253, 0.2) 50%, rgba(59, 130, 246, 0.4) 100%)',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          opacity: 0.6,
                          zIndex: -1,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
                          boxShadow: `
                            0 0 12px rgba(59, 130, 246, 0.8),
                            0 0 24px rgba(59, 130, 246, 0.4),
                            0 0 36px rgba(59, 130, 246, 0.2)
                          `,
                          animation: 'riceBorder 3s ease-in-out infinite, colorShift 12s ease-in-out infinite',
                          pointerEvents: 'none',
                          zIndex: 10,
                          filter: 'brightness(1.2)',
                        },
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 1)',
                          transform: 'translateY(-2px)',
                          boxShadow: `
                            0 4px 16px rgba(59, 130, 246, 0.25),
                            0 8px 32px rgba(59, 130, 246, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 1)
                          `,
                          '&::before': {
                            opacity: 1,
                          },
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                      } as const;

                      const dangerBtnSx = {
                        minWidth: 86,
                        height: 34,
                        px: 2.2,
                        fontWeight: 900,
                        borderRadius: '8px',
                        textTransform: 'none',
                        letterSpacing: '0.01em',
                        borderWidth: 2,
                        borderColor: alpha(theme.palette.text.primary, 0.18),
                        color: theme.palette.text.secondary,
                        bgcolor: 'rgba(255,255,255,0.35)',
                        '&:hover': {
                          borderColor: alpha(theme.palette.text.primary, 0.26),
                          bgcolor: 'rgba(255,255,255,0.55)',
                        },
                      } as const;

                      return (
                        <Box
                          key={row.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: gridCols,
                            width: '100%',
                            height: isRoleExpanded ? 'auto' : { xs: 150, md: 190 },
                            minHeight: { xs: 150, md: 190 },
                            bgcolor: 'rgba(255, 255, 255, 0.35)',
                            borderBottom: rowIdx === rows.length - 1 ? 'none' : gridBorder,
                            position: 'relative',
                          }}
                        >
                          {/* 分镜脚本 */}
                          <Box
                            onWheel={(e) => e.stopPropagation()}
                            sx={{
                              borderRight: gridBorder,
                              px: { xs: 1.0, md: 1.2 },
                              pt: { xs: 1.0, md: 1.2 },
                              pb: { xs: 1.4, md: 1.6 },
                              display: 'flex',
                              alignItems: 'stretch',
                              overflow: 'hidden',
                            }}
                          >
                            <InputBase
                              value={row.storyboardScript}
                              onChange={(e) => setStoryboardScript(row.id, e.target.value)}
                              multiline
                              minRows={6}
                              maxRows={10}
                              placeholder="请输入分镜脚本"
                              sx={{
                                width: '100%',
                                height: '100%',
                                fontSize: 13,
                                fontWeight: 500,
                                color: theme.palette.text.secondary,
                                '& textarea': {
                                  height: '100% !important',
                                  overflow: 'auto !important',
                                  overflowX: 'hidden !important',
                                  overscrollBehavior: 'contain',
                                  scrollbarGutter: 'stable',
                                  paddingBottom: '10px',
                                  resize: 'none',
                                  lineHeight: 1.35,
                                  color: theme.palette.text.secondary,
                                },
                                '& textarea::placeholder': {
                                  color: alpha(theme.palette.text.secondary, 0.8),
                                  opacity: 1,
                                },
                              }}
                            />
                          </Box>

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
                              position: 'relative',
                            }}
                          >
                            {isRolesLoading ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.8,
                                  color: alpha(theme.palette.text.secondary, 0.92),
                                  mb: 0.6,
                                  userSelect: 'none',
                                }}
                              >
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'inherit' }}>
                                  角色/音色分析中
                                </Typography>
                                <JumpingDots color={alpha(theme.palette.text.secondary, 0.75)} />
                              </Box>
                            ) : null}
                            {!isRolesLoading && rolesError ? (
                              <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.palette.error.main, mb: 0.6 }}>
                                {rolesError}
                              </Typography>
                            ) : null}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.4,
                                overflow: isRoleExpanded ? 'visible' : 'hidden',
                                flex: '1 1 auto',
                                pb: 2.2,
                              }}
                            >
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
                                            fontSize: '13px',
                                          }}
                                        >
                                          角色{roleNo}:
                                        </Typography>

                                        <Box
                                          onClick={() => fileInputRefs.current[inputKey]?.click()}
                                          role="button"
                                          aria-label="上传人物图片"
                                          sx={{
                                            width: 56,
                                            height: 64,
                                            borderRadius: 1,
                                            border: 2,
                                            borderStyle: 'dashed',
                                            borderColor: alpha(accent, 0.55),
                                            bgcolor: `linear-gradient(180deg, ${alpha(accent, 0.10)} 0%, rgba(255,255,255,0.0) 100%)`,
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            flex: '0 0 auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            '&:hover': {
                                              borderColor: alpha(accent, 0.75),
                                              bgcolor: `linear-gradient(180deg, ${alpha(accent, 0.14)} 0%, rgba(255,255,255,0.0) 100%)`,
                                            },
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
                                            <Box
                                              sx={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 0.25,
                                                color: alpha(accent, 0.9),
                                                userSelect: 'none',
                                              }}
                                            >
                                              <PersonAddAltOutlinedIcon sx={{ fontSize: 24, opacity: 0.92 }} />
                                              <Typography sx={{ fontSize: 10, fontWeight: 900, lineHeight: 1 }}>
                                                上传人物
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>

                                        <Box
                                          sx={{
                                            width: 76,
                                            height: 30,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: alpha(accent, 0.35),
                                            bgcolor: alpha(theme.palette.background.paper, 0.92),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            px: 0.5,
                                            flex: '0 0 auto',
                                            transition: 'border-color 140ms ease, box-shadow 140ms ease',
                                            '&:focus-within': {
                                              borderColor: alpha(accent, 0.75),
                                              boxShadow: `0 0 0 2px ${alpha(accent, 0.14)}`,
                                            },
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

                                        <Tooltip title="减少角色" placement="top" arrow>
                                          <Box component="span" sx={{ display: 'inline-flex', pointerEvents: 'auto' }}>
                                            <IconButton
                                              size="small"
                                              aria-label="减少角色"
                                              title="减少角色"
                                              onClick={() => deleteRoleCard(row.id, card.id)}
                                              disabled={!canDeleteRole}
                                              sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 1,
                                                border: 'none',
                                                boxShadow: 'none',
                                                outline: 'none',
                                                p: 0,
                                                ml: -0.5,
                                                color: accent,
                                                bgcolor: 'transparent',
                                                flex: '0 0 auto',
                                                '&.Mui-focusVisible': {
                                                  outline: 'none',
                                                  boxShadow: 'none',
                                                },
                                                '&:focus': {
                                                  outline: 'none',
                                                },
                                              }}
                                            >
                                              <Box
                                                component="img"
                                                src={`${process.env.PUBLIC_URL || ''}/reduce.svg`}
                                                alt="减少角色"
                                                sx={{ width: 16, height: 16, display: 'block' }}
                                              />
                                            </IconButton>
                                          </Box>
                                        </Tooltip>
                                      </Box>

                                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.0 }}>
                                        <Typography
                                          sx={{
                                            fontWeight: 900,
                                            color: accent,
                                            flex: '0 0 auto',
                                            minWidth: 56,
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.1,
                                            fontSize: '13px',
                                            pb: '2px',
                                          }}
                                        >
                                          音色:
                                        </Typography>
                                        <Box
                                          sx={{
                                            minHeight: 34,
                                            borderRadius: 0,
                                            borderTop: 'none',
                                            borderLeft: 'none',
                                            borderRight: 'none',
                                            borderBottom: `2px solid ${accent}`,
                                            bgcolor: 'transparent',
                                            px: 0,
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
                                            multiline
                                            sx={{
                                              width: '100%',
                                              fontSize: 13,
                                              wordBreak: 'break-word',
                                              '& input': { p: 0 },
                                              '& textarea': { p: 0, lineHeight: 1.2 },
                                            }}
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
                                <Tooltip title="添加角色" placement="top" arrow>
                                  <Box component="span" sx={{ display: 'inline-flex' }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => addRoleCard(row.id)}
                                      disabled={!canAddRole}
                                      aria-label="添加角色"
                                      sx={{
                                        width: 38,
                                        height: 28,
                                        borderRadius: 1,
                                        border: 0,
                                        color: accent,
                                        bgcolor: 'transparent',
                                        '&:hover': { bgcolor: 'transparent' },
                                        '&.Mui-focusVisible': { outline: 'none' },
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        src={`${process.env.PUBLIC_URL}/add_2.svg`}
                                        alt="添加角色"
                                        sx={{ width: 16, height: 16, display: 'block' }}
                                      />
                                    </IconButton>
                                  </Box>
                                </Tooltip>
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
                                variant="contained"
                                size="small"
                                sx={primaryBtnSx}
                              >
                                生成
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={secondaryBtnSx}
                              >
                                重新生成
                              </Button>
                            </Box>
                          </Box>

                          {/* 九宫格图像 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 视频脚本 */}
                          <Box
                            onWheel={(e) => e.stopPropagation()}
                            sx={{
                              borderRight: gridBorder,
                              px: { xs: 1.0, md: 1.2 },
                              pt: { xs: 1.0, md: 1.2 },
                              pb: { xs: 1.4, md: 1.6 },
                              display: 'flex',
                              alignItems: 'stretch',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            {isVideoLoading && !String(row.videoScript || '').trim() ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 10,
                                  left: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.8,
                                  pointerEvents: 'none',
                                  color: alpha(theme.palette.text.secondary, 0.9),
                                  userSelect: 'none',
                                  zIndex: 1,
                                }}
                              >
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'inherit' }}>
                                  视频脚本生成中
                                </Typography>
                                <JumpingDots color={alpha(theme.palette.text.secondary, 0.75)} />
                              </Box>
                            ) : null}
                            {!isVideoLoading && !String(row.videoScript || '').trim() && videoError ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 10,
                                  left: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                  zIndex: 1,
                                }}
                              >
                                <Typography sx={{ fontSize: 12, fontWeight: 800, color: theme.palette.error.main }}>
                                  {videoError}
                                </Typography>
                              </Box>
                            ) : null}
                            <InputBase
                              value={row.videoScript}
                              onChange={(e) => setVideoScript(row.id, e.target.value)}
                              multiline
                              minRows={6}
                              maxRows={10}
                              placeholder="请输入视频脚本"
                              sx={{
                                width: '100%',
                                height: '100%',
                                fontSize: 13,
                                fontWeight: 500,
                                color: theme.palette.text.secondary,
                                '& textarea': {
                                  height: '100% !important',
                                  overflow: 'auto !important',
                                  overscrollBehavior: 'contain',
                                  scrollbarGutter: 'stable',
                                  paddingBottom: '10px',
                                  resize: 'none',
                                  lineHeight: 1.35,
                                  color: theme.palette.text.secondary,
                                },
                                '& textarea::placeholder': {
                                  color: alpha(theme.palette.text.secondary, 0.8),
                                  opacity: 1,
                                },
                              }}
                            />
                          </Box>

                          {/* 生成视频 */}
                          <Box sx={{ borderRight: gridBorder }} />

                          {/* 操作（右） */}
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                              <Button
                                variant="contained"
                                size="small"
                                sx={primaryBtnSx}
                              >
                                生成
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={secondaryBtnSx}
                              >
                                重新生成
                              </Button>
                              {canDelete ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => deleteRow(row.id)}
                                  sx={dangerBtnSx}
                                >
                                  删除行
                                </Button>
                              ) : (
                                <Box sx={{ height: 30 }} />
                              )}
                            </Box>
                          </Box>

                          {/* 角色列展开/收缩：每行右下角 */}
                          <Box
                            onClick={() => toggleRowRoleExpanded(row.id)}
                            role="button"
                            aria-label={isRoleExpanded ? '收缩角色内容' : '展开角色内容'}
                            sx={{
                              position: 'absolute',
                              right: 10,
                              bottom: 8,
                              cursor: 'pointer',
                              userSelect: 'none',
                              color: alpha(theme.palette.text.secondary, 0.85),
                              fontSize: 12,
                              fontWeight: 800,
                              zIndex: 2,
                              '&:hover': {
                                color: alpha(theme.palette.text.secondary, 1),
                              },
                            }}
                          >
                            {isRoleExpanded ? '收缩' : '展开'}
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
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NewsPage;
