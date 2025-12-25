import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import './LogoCarousel.css';

const logos = [
  { name: 'ai动画制作', icon: '/sunny.svg' },
  { name: 'ai视频剪辑', icon: '/night-sunny.svg' },
];

const LogoCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Only use the 2 items for a "one pass" style animation
  const displayLogos = logos;

  return (
    <Box className="logo-carousel-container">
      <Box className="logo-carousel-viewport">
        <Box className="logo-carousel-track">
          {displayLogos.map((logo, index) => (
            <Box 
              key={index} 
              className={`logo-item ${index === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
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
