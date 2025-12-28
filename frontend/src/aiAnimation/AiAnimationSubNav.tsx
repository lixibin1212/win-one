import React from 'react';
import { Box, Button } from '@mui/material';

export type AiAnimationSubSection = 'role' | 'script' | 'animation';

export const AiAnimationSubNav: React.FC<{
  value: AiAnimationSubSection;
  onChange: (v: AiAnimationSubSection) => void;
}> = ({ value, onChange }) => {
  const activeOutline = '1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff';

  const iconSrc = (active: boolean) => (active ? '/xiao_dh_xz.svg' : '/xiao_dh.svg');

  const iconSx = {
    width: 16,
    height: 16,
    mr: 0.6,
    display: 'inline-block',
    verticalAlign: 'middle',
    flex: '0 0 auto',
  };

  const itemSx = (active: boolean) => ({
    minWidth: 'auto',
    px: 0.5,
    py: 0,
    fontWeight: 700,
    color: active ? '#f97316' : '#0f172a',
    textShadow: active ? activeOutline : 'none',
    '&:hover': { bgcolor: 'transparent', color: '#f97316' },
  });

  const sepSx = {
    px: 0.6,
    color: '#0f172a',
    fontWeight: 900,
    userSelect: 'none' as const,
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'flex-start' }}>
      <Button variant="text" sx={itemSx(value === 'role')} onClick={() => onChange('role')}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <Box component="img" src={iconSrc(value === 'role')} alt="" sx={iconSx} />
          角色形象生成
        </Box>
      </Button>
      <Box component="span" sx={sepSx}>
        /
      </Box>
      <Button variant="text" sx={itemSx(value === 'script')} onClick={() => onChange('script')}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <Box component="img" src={iconSrc(value === 'script')} alt="" sx={iconSx} />
          脚本生成
        </Box>
      </Button>
      <Box component="span" sx={sepSx}>
        /
      </Box>
      <Button variant="text" sx={itemSx(value === 'animation')} onClick={() => onChange('animation')}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <Box component="img" src={iconSrc(value === 'animation')} alt="" sx={iconSx} />
          动画制作
        </Box>
      </Button>
    </Box>
  );
};
