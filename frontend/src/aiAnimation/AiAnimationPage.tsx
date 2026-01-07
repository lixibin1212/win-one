import React, { useMemo, useState } from 'react';
import { Box, InputBase, Paper, ThemeProvider, Typography, Tooltip, createTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopNavBar } from '../shared/TopNavBar';
import { AiAnimationSubNav, AiAnimationSubSection } from './AiAnimationSubNav';
import { RoleImageGeneratorPanel } from './RoleImageGeneratorPanel';
import { ScriptAnalysisPanel } from './ScriptAnalysisPanel';
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

export const AiAnimationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const topTab = useMemo<'animation' | 'video'>(() => {
    if (location.pathname === '/ai-video-edit') return 'video';
    return 'animation';
  }, [location.pathname]);

  const [sub, setSub] = useState<AiAnimationSubSection>('role');
  const [scriptInstance, setScriptInstance] = useState(0);
  const [animationRows, setAnimationRows] = useState(2);
  const [storyboardScripts, setStoryboardScripts] = useState<string[]>(() => Array.from({ length: 2 }, () => ''));
  const [videoScripts, setVideoScripts] = useState<string[]>(() => Array.from({ length: 2 }, () => ''));

  const handleSubChange = (next: AiAnimationSubSection) => {
    if (sub === 'script' && next !== 'script') {
      setScriptInstance((v) => v + 1);
    }
    setSub(next);
  };

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
          {/* 顶部两项：ai动画制作 / ai视频剪辑 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 10, mb: 6 }}>
            <Typography
              sx={{
                fontWeight: 900,
                color: topTab === 'animation' ? '#f97316' : '#94a3b8',
                cursor: topTab === 'animation' ? 'default' : 'pointer',
              }}
              onClick={topTab === 'animation' ? undefined : () => navigate('/ai-animation')}
            >
              ai动画制作
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                color: topTab === 'video' ? '#f97316' : '#94a3b8',
                cursor: topTab === 'video' ? 'default' : 'pointer',
              }}
              onClick={topTab === 'video' ? undefined : () => navigate('/ai-video-edit')}
            >
              ai视频剪辑
            </Typography>
          </Box>

          {/* 红框下方：仅此区域根据顶部 tab 切换 */}
          {topTab === 'video' ? (
            <Box sx={{ mb: 3 }}>
              <AiVideoEditPage embedded />
            </Box>
          ) : (
            <>
              {/* 二级导航 */}
              <Box sx={{ mb: 3 }}>
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
                    {(() => {
                      const headers = ['分镜脚本', '角色', '操作', '九宫格图像', '视频脚本', '生成视频', '操作'];
                      const borderColor = 'rgba(15, 23, 42, 0.18)';
                      const border = `2px solid ${borderColor}`;
                      const gridCols = '1.05fr 1.55fr 0.55fr 1.05fr 1.05fr 1.25fr 0.55fr';
                      const rowHeight = { xs: 150, md: 190 };
                      return (
                        <Box
                          sx={{
                            width: '100%',
                            borderLeft: border,
                            borderRight: border,
                            borderTop: border,
                            borderBottom: border,
                            boxSizing: 'border-box',
                          }}
                        >
                          <Box sx={{ display: 'grid', gridTemplateColumns: gridCols, width: '100%' }}>
                            {headers.map((t, idx) => (
                              <Box
                                key={t}
                                sx={{
                                  textAlign: 'center',
                                  fontWeight: 900,
                                  color: '#0f172a',
                                  py: 2,
                                  borderBottom: border,
                                  borderRight: idx === headers.length - 1 ? 'none' : border,
                                }}
                              >
                                {t}
                              </Box>
                            ))}
                          </Box>

                          <Box sx={{ width: '100%' }}>
                            {Array.from({ length: animationRows }).map((_, rowIdx) => (
                              <Box
                                key={rowIdx}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: gridCols,
                                  width: '100%',
                                  height: rowHeight,
                                  bgcolor: 'rgba(255, 255, 255, 0.35)',
                                  borderBottom: rowIdx === animationRows - 1 ? 'none' : border,
                                }}
                              >
                                {headers.map((__, colIdx) => (
                                  <Box
                                    key={colIdx}
                                    sx={{
                                      borderRight: colIdx === headers.length - 1 ? 'none' : border,
                                      height: '100%',
                                      px: colIdx === 0 || colIdx === 4 ? 1.2 : 0,
                                      py: colIdx === 0 || colIdx === 4 ? 1.1 : 0,
                                      display: colIdx === 0 || colIdx === 4 ? 'flex' : 'block',
                                      alignItems: colIdx === 0 || colIdx === 4 ? 'stretch' : 'initial',
                                    }}
                                  >
                                    {colIdx === 0 ? (
                                      <InputBase
                                        value={storyboardScripts[rowIdx] ?? ''}
                                        onChange={(e) =>
                                          setStoryboardScripts((prev) => {
                                            const next = prev.slice();
                                            next[rowIdx] = e.target.value;
                                            return next;
                                          })
                                        }
                                        multiline
                                        placeholder="请输入分镜脚本"
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color: '#0f172a',
                                          '& textarea': {
                                            height: '100% !important',
                                            overflow: 'auto',
                                            resize: 'none',
                                            lineHeight: 1.35,
                                          },
                                        }}
                                      />
                                    ) : colIdx === 4 ? (
                                      <InputBase
                                        value={videoScripts[rowIdx] ?? ''}
                                        onChange={(e) =>
                                          setVideoScripts((prev) => {
                                            const next = prev.slice();
                                            next[rowIdx] = e.target.value;
                                            return next;
                                          })
                                        }
                                        multiline
                                        placeholder="请输入视频脚本"
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color: '#0f172a',
                                          '& textarea': {
                                            height: '100% !important',
                                            overflow: 'auto',
                                            resize: 'none',
                                            lineHeight: 1.35,
                                          },
                                        }}
                                      />
                                    ) : null}
                                  </Box>
                                ))}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })()}
                  </Paper>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Tooltip title="增加视频栏" placement="top">
                      <Box
                        role="button"
                        aria-label="增加视频栏"
                        onClick={() => {
                          setAnimationRows((v) => v + 1);
                          setStoryboardScripts((prev) => [...prev, '']);
                          setVideoScripts((prev) => [...prev, '']);
                        }}
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
    </ThemeProvider>
  );
};
