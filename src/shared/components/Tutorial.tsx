import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TutorialProps {
  onComplete: () => void;
}

interface TutorialStep {
  id: number;
  type: 'static' | 'interactive' | 'demo' | 'cta';
  title: string;
  subtitle: string;
  autoAdvance?: number;
}

const STEPS: TutorialStep[] = [
  { id: 1, type: 'static', title: 'Parçalarını tanı', subtitle: 'Her turda 3 parça gelir', autoAdvance: 0 },
  { id: 2, type: 'interactive', title: 'Parçayı yerleştir', subtitle: 'Sürükle veya tıkla', autoAdvance: 3000 },
  { id: 3, type: 'demo', title: 'Satır doldur', subtitle: 'Tam satır = puan', autoAdvance: 2500 },
  { id: 4, type: 'demo', title: 'Yetenekleri kullan', subtitle: 'Flux biriktir, harcama yap', autoAdvance: 0 },
  { id: 5, type: 'cta', title: 'Hazırsın!', subtitle: 'Cyberpunk bulmaca maceran başlıyor', autoAdvance: 0 },
];

// Demo Grid Component
const DemoGrid: React.FC<{
  highlightCells?: number[][];
  filledCells?: { row: number; col: number; color: string }[];
  clearRow?: number;
  size?: number;
}> = ({ highlightCells = [], filledCells = [], clearRow, size = 4 }) => {
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (clearRow !== undefined) {
      const t = setTimeout(() => setCleared(true), 800);
      return () => clearTimeout(t);
    }
  }, [clearRow]);

  const CELL_SIZE = 36;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${CELL_SIZE}px)`,
        gap: 3,
        margin: '0 auto',
      }}
    >
      {Array(size)
        .fill(null)
        .map((_, row) =>
          Array(size)
            .fill(null)
            .map((_, col) => {
              const isHighlight = highlightCells.some(([r, c]) => r === row && c === col);
              const filled = filledCells.find((f) => f.row === row && f.col === col);
              const isClearing = clearRow === row;

              return (
                <motion.div
                  key={`${row}-${col}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: 6,
                    background: filled
                      ? filled.color
                      : isHighlight
                      ? 'rgba(59,130,246,0.3)'
                      : 'rgba(255,255,255,0.04)',
                    border: isHighlight
                      ? '1px solid rgba(59,130,246,0.6)'
                      : '0.5px solid rgba(255,255,255,0.06)',
                  }}
                  animate={
                    isClearing && !cleared
                      ? { scale: [1, 1.1, 0], opacity: [1, 1, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4, delay: col * 0.05 }}
                />
              );
            })
        )}
    </div>
  );
};

// Demo Piece Component
const DemoPiece: React.FC<{
  shape: number[][];
  color: string;
  onPlace?: () => void;
}> = ({ shape, color, onPlace }) => {
  const CELL = 32;

  return (
    <motion.div
      drag
      dragSnapToOrigin={!onPlace}
      onDragEnd={() => {
        if (onPlace) onPlace();
      }}
      whileDrag={{ scale: 1.1, zIndex: 50 }}
      style={{ cursor: 'grab', display: 'inline-block' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${shape[0].length}, ${CELL}px)`,
          gap: 2,
        }}
      >
        {shape.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 5,
                background: cell ? color : 'transparent',
                border: cell ? `0.5px solid ${color}60` : 'none',
              }}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

// Flux Demo Component
const FluxDemo: React.FC = () => {
  const [flux, setFlux] = useState(0);
  const [skillUsed, setSkillUsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlux((prev) => Math.min(100, prev + 5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSkillClick = () => {
    setSkillUsed(true);
    setFlux(0);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Flux Bar */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            marginBottom: 6,
            letterSpacing: '0.1em',
          }}
        >
          FLUX ENERGY
        </div>
        <div
          style={{
            width: 200,
            height: 8,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: 4,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${flux}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div style={{ fontSize: 14, color: '#60a5fa', marginTop: 4, fontWeight: 700 }}>
          {flux}%
        </div>
      </div>

      {/* Skill Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={handleSkillClick}
          disabled={flux < 30 || skillUsed}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: flux >= 30 && !skillUsed ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: flux >= 30 && !skillUsed ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: 11,
            fontWeight: 600,
            cursor: flux >= 30 && !skillUsed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          🔄 Yenile
        </button>
        <button
          disabled
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          🔨 Kır
        </button>
        <button
          disabled
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          💣 Bomba
        </button>
      </div>

      {skillUsed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            marginTop: 16,
            color: '#34d399',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ✨ Parçalar yenilendi!
        </motion.div>
      )}
    </div>
  );
};

export const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [piecePlaced, setPiecePlaced] = useState(false);
  const [showClearAnimation, setShowClearAnimation] = useState(false);

  const currentStep = STEPS[step];

  // Auto advance logic
  useEffect(() => {
    if (currentStep.autoAdvance && currentStep.autoAdvance > 0) {
      const timer = setTimeout(() => {
        handleNext();
      }, currentStep.autoAdvance);
      return () => clearTimeout(timer);
    }
  }, [step, currentStep.autoAdvance]);

  // Step 2: Auto demo after 3 seconds
  useEffect(() => {
    if (step === 1 && !piecePlaced) {
      const timer = setTimeout(() => {
        setPiecePlaced(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, piecePlaced]);

  // Step 3: Trigger clear animation
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        setShowClearAnimation(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setPiecePlaced(false);
      setShowClearAnimation(false);
    } else {
      try {
        localStorage.setItem('flux_tutorial_seen', 'true');
        localStorage.setItem('flux_tutorial_version', '2');
      } catch {}
      onComplete();
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('flux_tutorial_seen', 'true');
      localStorage.setItem('flux_tutorial_version', '2');
    } catch {}
    onComplete();
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: // Step 1: Parçaları tanı
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
              {/* 3 demo pieces */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0 }}
              >
                <DemoPiece
                  shape={[
                    [1, 1],
                    [1, 0],
                  ]}
                  color="#a78bfa"
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              >
                <DemoPiece
                  shape={[
                    [1, 1, 1],
                    [0, 1, 0],
                  ]}
                  color="#3b82f6"
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
              >
                <DemoPiece shape={[[1, 1, 1]]} color="#06b6d4" />
              </motion.div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Bunlar senin parçaların
            </p>
          </div>
        );

      case 1: // Step 2: Sürükleyerek yerleştir
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <DemoGrid
                size={4}
                highlightCells={
                  !piecePlaced
                    ? [
                        [2, 0],
                        [2, 1],
                        [3, 1],
                      ]
                    : []
                }
                filledCells={
                  piecePlaced
                    ? [
                        { row: 2, col: 0, color: '#a78bfa' },
                        { row: 2, col: 1, color: '#a78bfa' },
                        { row: 3, col: 1, color: '#a78bfa' },
                      ]
                    : []
                }
              />
            </div>
            {!piecePlaced && (
              <div style={{ marginBottom: 16 }}>
                <DemoPiece
                  shape={[
                    [1, 1],
                    [0, 1],
                  ]}
                  color="#a78bfa"
                  onPlace={() => setPiecePlaced(true)}
                />
              </div>
            )}
            {piecePlaced && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  color: '#34d399',
                  fontSize: 20,
                  fontWeight: 700,
                  marginTop: 16,
                }}
              >
                🎉 Harika! +45 puan
              </motion.div>
            )}
          </div>
        );

      case 2: // Step 3: Satır doldur
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <DemoGrid
                size={4}
                filledCells={[
                  { row: 3, col: 0, color: '#3b82f6' },
                  { row: 3, col: 1, color: '#a78bfa' },
                  { row: 3, col: 2, color: '#06b6d4' },
                  { row: 3, col: 3, color: '#10b981' },
                  { row: 2, col: 1, color: '#3b82f6' },
                  { row: 1, col: 2, color: '#a78bfa' },
                ]}
                clearRow={showClearAnimation ? 3 : undefined}
              />
            </div>
            {showClearAnimation && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                  color: '#f59e0b',
                  fontSize: 24,
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                +100 puan! ✨
              </motion.div>
            )}
          </div>
        );

      case 3: // Step 4: Flux ve yetenekler
        return <FluxDemo />;

      case 4: // Step 5: Hazırsın!
        return (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              style={{ fontSize: 64, marginBottom: 16 }}
            >
              🎮
            </motion.div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Artık tüm mekanikleri biliyorsun!
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tutorial-overlay">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          className="tutorial-card"
        >
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>

          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === step
                      ? '#3b82f6'
                      : i < step
                      ? '#1e40af'
                      : 'rgba(255,255,255,0.1)',
                  width: i === step ? 32 : 16,
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'white',
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {currentStep.title}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 32,
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
          >
            {currentStep.subtitle}
          </p>

          {/* Step Content */}
          <div style={{ marginBottom: 32 }}>{renderStepContent()}</div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              background: step === STEPS.length - 1 ? '#10b981' : '#3b82f6',
              border: 'none',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.05em',
            }}
          >
            {step === STEPS.length - 1 ? '🚀 Oynamaya Başla!' : 'Devam →'}
          </button>

          {/* Step Counter */}
          <p
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              marginTop: 12,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            {step + 1} / {STEPS.length}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/** Check if tutorial has been seen */
export const shouldShowTutorial = (): boolean => {
  try {
    return localStorage.getItem('flux_tutorial_version') !== '2';
  } catch {
    return true;
  }
};
