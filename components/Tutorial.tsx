import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Move, Target, Zap, ChevronRight, X } from 'lucide-react';

interface TutorialProps {
    onComplete: () => void;
}

const STEPS = [
    {
        icon: <Move size={40} className="text-blue-400" />,
        title: 'Parçaları Sürükle',
        desc: 'Alttaki tepsiden parçaları sürükleyip ızgaraya yerleştir. Her parça uygun boşluğa oturmalı.',
        emoji: '👆',
    },
    {
        icon: <Target size={40} className="text-indigo-400" />,
        title: 'Satır & Sütun Tamamla',
        desc: 'Bir satır veya sütunu tamamen doldurduğunda otomatik silinir ve puan kazanırsın. Ardarda silersen kombo yaparsın!',
        emoji: '✨',
    },
    {
        icon: <Zap size={40} className="text-yellow-400" />,
        title: 'Yetenekleri Kullan',
        desc: 'Flux enerjin yeterliyse özel yetenekleri kullan: Yenile, Kır veya Bomba. Sıkışınca hayat kurtarır!',
        emoji: '⚡',
    },
];

export const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            try { localStorage.setItem('flux_tutorial_seen', 'true'); } catch { }
            onComplete();
        }
    };

    const handleSkip = () => {
        try { localStorage.setItem('flux_tutorial_seen', 'true'); } catch { }
        onComplete();
    };

    const current = STEPS[step];

    return (
        <div className="tutorial-overlay">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.85, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    className="tutorial-card"
                >
                    {/* Skip */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' :
                                    i < step ? 'w-4 bg-blue-700' : 'w-4 bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Emoji */}
                    <div className="text-5xl mb-4">{current.emoji}</div>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            {current.icon}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-display font-bold text-white mb-3 tracking-wide">
                        {current.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed mb-8 px-2">
                        {current.desc}
                    </p>

                    {/* Action */}
                    <button
                        onClick={handleNext}
                        className="w-full py-3.5 rounded-xl font-bold tracking-wider text-sm overflow-hidden relative group transition-all active:scale-95"
                        style={{
                            background: '#3b82f6',
                        }}
                    >
                        <span className="relative z-10 text-white flex items-center justify-center gap-2">
                            {step < STEPS.length - 1 ? (
                                <>Devam <ChevronRight size={16} /></>
                            ) : (
                                'Oynamaya Başla! 🎮'
                            )}
                        </span>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </button>

                    {/* Step count */}
                    <p className="text-xs text-white/20 mt-4 font-mono">{step + 1} / {STEPS.length}</p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/** Check if tutorial has been seen */
export const shouldShowTutorial = (): boolean => {
    try {
        return localStorage.getItem('flux_tutorial_seen') !== 'true';
    } catch {
        return true;
    }
};
