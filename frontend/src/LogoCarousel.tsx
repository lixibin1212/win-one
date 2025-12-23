import React from 'react';
import { Box, Typography } from '@mui/material';
import './LogoCarousel.css';

const logos = [
  { name: 'mercado libre', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mercado_Libre_logo.svg/2560px-Mercado_Libre_logo.svg.png' },
  { name: 'Mercedes-Benz', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2010.svg/2048px-Mercedes-Benz_Logo_2010.svg.png' },
  { name: 'shopify', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/2560px-Shopify_logo_2018.svg.png' },
  { name: 'PHILIPS', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Philips_logo.svg/2560px-Philips_logo.svg.png' },
  { name: 'SOCIETE GENERALE', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Societe_Generale_logo.svg/2560px-Societe_Generale_logo.svg.png' },
  { name: 'Spotify', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_with_text.svg/2560px-Spotify_logo_with_text.svg.png' },
];

const LogoCarousel: React.FC = () => {
  // Duplicate logos to create a seamless loop
  const displayLogos = [...logos, ...logos, ...logos];

  return (
    <Box className="logo-carousel-container">
      <Box className="logo-carousel-track">
        {displayLogos.map((logo, index) => (
          <Box key={index} className="logo-item">
            <img src={logo.icon} alt={logo.name} className="logo-image" />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default LogoCarousel;
