import React, { useState, useEffect, useRef } from 'react';
import './ThreeDCarousel.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface CarouselItem {
  id: number;
  image: string;
  title: string;
}

const defaultItems: CarouselItem[] = [
  { id: 1, image: 'https://picsum.photos/id/237/600/800', title: 'Project Alpha' },
  { id: 2, image: 'https://picsum.photos/id/238/600/800', title: 'Urban Life' },
  { id: 3, image: 'https://picsum.photos/id/239/600/800', title: 'Nature Story' },
  { id: 4, image: 'https://picsum.photos/id/240/600/800', title: 'Tech Future' },
  { id: 5, image: 'https://picsum.photos/id/241/600/800', title: 'Ocean Blue' },
  { id: 6, image: 'https://picsum.photos/id/242/600/800', title: 'Mountain High' },
  { id: 7, image: 'https://picsum.photos/id/243/600/800', title: 'Forest Whisper' },
  { id: 8, image: 'https://picsum.photos/id/244/600/800', title: 'City Lights' },
  { id: 9, image: 'https://picsum.photos/id/250/600/800', title: 'Desert Wind' },
  { id: 10, image: 'https://picsum.photos/id/251/600/800', title: 'River Flow' },
  { id: 11, image: 'https://picsum.photos/id/252/600/800', title: 'Sky High' },
  { id: 12, image: 'https://picsum.photos/id/253/600/800', title: 'Night Dream' },
];

const ThreeDCarousel: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cellCount] = useState(12);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Configuration
  const cardWidth = 260; // Slightly smaller width to fit more cards
  const gap = 100; // Increased gap for more space between cards
  const effectiveWidth = cardWidth + gap;
  const radius = Math.round((effectiveWidth / 2) / Math.tan(Math.PI / cellCount));

  const rotateCarousel = () => {
    const angle = (360 / cellCount) * selectedIndex * -1;
    if (sceneRef.current) {
      sceneRef.current.style.transform = `translateZ(-${radius}px) rotateY(${angle}deg)`;
    }
  };

  useEffect(() => {
    rotateCarousel();
  }, [selectedIndex, radius, cellCount]);

  // Auto rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    setSelectedIndex(prev => prev - 1);
  };

  const handleNext = () => {
    setSelectedIndex(prev => prev + 1);
  };

  // Normalize index for indicators (0 to cellCount-1)
  const normalizedIndex = ((selectedIndex % cellCount) + cellCount) % cellCount;

  return (
    <div className="carousel-container" style={{ marginBottom: '60px' }}>
      <div className="carousel-scene" ref={sceneRef}>
        {defaultItems.map((item, index) => {
          const angle = (360 / cellCount) * index;
          // Check if this card is the currently selected one (normalized)
          const isCurrent = index === normalizedIndex;

          const handleCardClick = () => {
            let diff = index - normalizedIndex;
            // Shortest path logic
            if (diff > cellCount / 2) diff -= cellCount;
            if (diff < -cellCount / 2) diff += cellCount;
            setSelectedIndex(prev => prev + diff);
          };

          return (
            <div
              key={item.id}
              className={`carousel-card ${isCurrent ? 'active' : ''}`}
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                '--bg-img': `url(${item.image})`
              } as React.CSSProperties}
              onClick={handleCardClick}
            >
              <div className="carousel-card-inner">
                <img src={item.image} alt={item.title} className="carousel-card-img" />
                <div className="carousel-card-overlay">
                  <div className="play-button">
                    <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
                  </div>
                  <h3>{item.title}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-control prev" onClick={handlePrev}>
        <ArrowBackIosNewIcon fontSize="small" />
      </div>
      <div className="carousel-control next" onClick={handleNext}>
        <ArrowForwardIosIcon fontSize="small" />
      </div>

      <div className="carousel-indicators">
        {defaultItems.map((_, index) => (
          <div
            key={index}
            className={`carousel-indicator ${index === normalizedIndex ? 'active' : ''}`}
            onClick={() => setSelectedIndex(selectedIndex - (normalizedIndex - index))}
          />
        ))}
      </div>
    </div>
  );
};

export default ThreeDCarousel;
