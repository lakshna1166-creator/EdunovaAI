import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 4 targeted AI-powered education & personalized digital tutor background images
const heroImages = [
  {
    localUrl: '/images/ai-learning-1.jpg',
    remoteFallback: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80',
    title: 'Digital AI Tutor & Educational Technology'
  },
  {
    localUrl: '/images/ai-learning-2.jpg',
    remoteFallback: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1600&auto=format&fit=crop&q=80',
    title: 'Student Learning with Personalized AI System'
  },
  {
    localUrl: '/images/ai-learning-3.jpg',
    remoteFallback: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&fit=crop&q=80',
    title: 'Smart AI Mentorship & Interactive Learning'
  },
  {
    localUrl: '/images/ai-learning-4.jpg',
    remoteFallback: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80',
    title: 'Neural Knowledge Graphs & AI Intelligence'
  }
];

export default function HeroImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});

  // Auto-change every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : heroImages.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      {/* Background AI Education Images - Bright, Sharp, Visible (opacity: 0.65, brightness: 1.08, saturate: 1.10) */}
      {heroImages.map((img, index) => {
        const isActive = currentIndex === index;
        const imageSrc = loadedImages[index] || img.localUrl;

        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${imageSrc}), url(${img.remoteFallback})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              opacity: isActive ? 0.65 : 0,
              transition: 'opacity 1.0s cubic-bezier(0.16, 1, 0.3, 1), transform 5s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isActive ? 'scale(1.035)' : 'scale(1)',
              filter: 'brightness(1.08) saturate(1.10) contrast(1.04)'
            }}
          >
            {/* Hidden image element to trigger fallback if local file fails */}
            <img
              src={img.localUrl}
              alt=""
              style={{ display: 'none' }}
              onError={() => {
                setLoadedImages((prev) => ({
                  ...prev,
                  [index]: img.remoteFallback
                }));
              }}
            />
          </div>
        );
      })}

      {/* Subtle ambient tint at the bottom for smooth canvas transition */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.95) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Slider Controls: 4 Indicator Dots + Prev/Next Controls */}
      <div
        className="hero-slider-controls"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 5,
          pointerEvents: 'auto',
          background: 'rgba(255, 255, 255, 0.92)',
          padding: '6px 14px',
          borderRadius: '999px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Prev Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Slide"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
        >
          <ChevronLeft size={16} />
        </button>

        {/* 4 Slider Indicators */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {heroImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: currentIndex === i ? '22px' : '7px',
                height: '7px',
                borderRadius: '999px',
                background: currentIndex === i ? '#2563EB' : '#CBD5E1',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .hero-slider-controls {
            bottom: 12px !important;
            right: 50% !important;
            transform: translateX(50%) !important;
            padding: 4px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
