import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './LogoCarousel.css';

const logos = [
  { name: 'ai动画制作', icon: '/sunny.svg' },
  { name: 'ai视频剪辑', icon: '/night-sunny.svg' },
];

type LogoCarouselProps = {
  activeIndex?: number;
  onSelect?: (index: number) => void;
  navigateOnSelect?: boolean;
  persistKey?: string;
  animationDurationSec?: number;
};

const LogoCarousel: React.FC<LogoCarouselProps> = ({
  activeIndex: activeIndexProp,
  onSelect,
  navigateOnSelect = true,
  persistKey,
  animationDurationSec = 15,
}) => {
  const [activeIndexState, setActiveIndexState] = useState(0);
  const navigate = useNavigate();
  const activeIndex = activeIndexProp ?? activeIndexState;

  const trackStyle = useMemo(() => {
    if (!persistKey) return undefined;
    const storageKey = `logoCarouselStart:${persistKey}`;
    let start = Number(localStorage.getItem(storageKey) || '0');
    if (!Number.isFinite(start) || start <= 0) {
      start = Date.now();
      localStorage.setItem(storageKey, String(start));
    }
    const elapsedSec = ((Date.now() - start) / 1000) % animationDurationSec;
    return {
      animationDuration: `${animationDurationSec}s`,
      animationDelay: `-${elapsedSec}s`,
    } as React.CSSProperties;
  }, [persistKey, animationDurationSec]);
  // Only use the 2 items for a "one pass" style animation
  const displayLogos = logos;

  return (
    <Box className="logo-carousel-container">
      <Box className="logo-carousel-viewport">
        <Box className="logo-carousel-track" style={trackStyle}>
          {displayLogos.map((logo, index) => (
            <Box 
              key={index} 
              className={`logo-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => {
                if (activeIndexProp === undefined) setActiveIndexState(index);
                onSelect?.(index);
                if (navigateOnSelect) {
                  if (index === 0) navigate('/ai-animation');
                  if (index === 1) navigate('/ai-video-edit');
                }
              }}
            >
              {logo.icon && (
                <img 
                  src={logo.icon} 
                  alt="" 
                  className="logo-icon" 
                  style={{ opacity: index === activeIndex ? 1 : 0.6 }}
                />
              )}
              <Typography 
                variant="h6" 
                sx={{ 
                  color: index === activeIndex ? '#ed6c02' : '#64748b', 
                  fontWeight: 600,
                  opacity: index === activeIndex ? 1 : 0.6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                }}
              >
                {logo.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LogoCarousel;
