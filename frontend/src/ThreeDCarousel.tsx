import React, { useState, useEffect, useRef } from 'react';
import './ThreeDCarousel.css';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface CarouselItem {
  id: number;
  image?: string;
  video?: string;
  title: string;
  type: 'image' | 'video';
}

const defaultItems: CarouselItem[] = [
  { id: 1, video: 'https://gqkdylnbgzxpbhdklgbx.supabase.co/storage/v1/object/sign/storage/enhance_1999788448196263938.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjdjNTRhMy1kOWI2LTQ5ZWQtOGU2Mi05YmYwMWI4YTllNzQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdG9yYWdlL2VuaGFuY2VfMTk5OTc4ODQ0ODE5NjI2MzkzOC5tcDQiLCJpYXQiOjE3NjYxNzM3MTUsImV4cCI6NDkxOTc3MzcxNX0.7aVRhXHkIsDYJfVTvTPOjTxS4kCkU1-H2YfojK9KM94', title: 'Project Alpha', type: 'video' },
  { id: 2, video: 'https://gqkdylnbgzxpbhdklgbx.supabase.co/storage/v1/object/sign/storage/23c7516a-ee5c-4c24-9a64-aaeeb4f42bda.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjdjNTRhMy1kOWI2LTQ5ZWQtOGU2Mi05YmYwMWI4YTllNzQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdG9yYWdlLzIzYzc1MTZhLWVlNWMtNGMyNC05YTY0LWFhZWViNGY0MmJkYS5tcDQiLCJpYXQiOjE3NjYxNzQ1MTAsImV4cCI6NDkxOTc3NDUxMH0.R-uKmLW8YIK45Z8W5DliFoCQaIDPPvPEnV3ehZH12Ws', title: 'Urban Life', type: 'video' },
  { id: 3, image: 'https://picsum.photos/id/239/600/800', title: 'Nature Story', type: 'image' },
  { id: 4, image: 'https://picsum.photos/id/240/600/800', title: 'Tech Future', type: 'image' },
  { id: 5, image: 'https://vvrexwgovtnjdcdlwciw.supabase.co/storage/v1/object/public/Vwin/op/93743779b5944e1725008b6ac06113d%20(1).png', title: 'Ocean Blue', type: 'image' },
  { id: 6, image: 'https://vvrexwgovtnjdcdlwciw.supabase.co/storage/v1/object/public/Vwin/op/bb1a5c6782c54d394887fc4d7ce51c3%20(1).png', title: 'Mountain High', type: 'image' },
  { id: 7, image: 'https://picsum.photos/id/243/600/800', title: 'Forest Whisper', type: 'image' },
  { id: 8, image: 'https://picsum.photos/id/244/600/800', title: 'City Lights', type: 'image' },
  { id: 9, image: 'https://picsum.photos/id/250/600/800', title: 'Desert Wind', type: 'image' },
  { id: 10, image: 'https://picsum.photos/id/251/600/800', title: 'River Flow', type: 'image' },
  { id: 11, image: 'https://picsum.photos/id/252/600/800', title: 'Sky High', type: 'image' },
  { id: 12, image: 'https://picsum.photos/id/253/600/800', title: 'Night Dream', type: 'image' },
];

const ThreeDCarousel: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cellCount] = useState(12);
  const [isPaused, setIsPaused] = useState(false);
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
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setSelectedIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setSelectedIndex(prev => prev - 1);
  };

  const handleNext = () => {
    setSelectedIndex(prev => prev + 1);
  };

  // Normalize index for indicators (0 to cellCount-1)
  const normalizedIndex = ((selectedIndex % cellCount) + cellCount) % cellCount;

  return (
    <div 
      className="carousel-container" 
      style={{ marginBottom: '60px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
                '--bg-img': item.type === 'video' ? 'none' : `url(${item.image})`
              } as React.CSSProperties}
              onClick={handleCardClick}
            >
              <div className="carousel-card-inner">
                {item.type === 'video' ? (
                  <video 
                    src={item.video} 
                    className="carousel-card-img" 
                    loop 
                    muted 
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img src={item.image} alt={item.title} className="carousel-card-img" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeDCarousel;
