import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const EvolutionAnimation = ({ isOpen, onClose, beforeSprite, afterSprite, digimonName, targetName }) => {
  const [phase, setPhase] = useState('initial'); // initial, flash, evolving, final
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let timeouts = [];
    
    if (isOpen) {
      setPhase('initial');
      // Sequence:
      // 0-2s: Show initial sprite pulsing
      // 2s: Flash start
      // 2-4s: Silhouette transition / flickering
      // 4s: Big Flash
      // 4.5s: Reveal new sprite
      // 6s: Close
      
      const timeline = async () => {
        timeouts.push(setTimeout(() => setPhase('flash-start'), 2000));
        timeouts.push(setTimeout(() => setPhase('evolving'), 2500));
        timeouts.push(setTimeout(() => setPhase('final-flash'), 5000));
        timeouts.push(setTimeout(() => {
            setPhase('revealed');
            setShowConfetti(true);
        }, 5500));
        timeouts.push(setTimeout(onClose, 8500));
      };
      
      timeline();
    }
    
    return () => timeouts.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 transition-opacity duration-500">
      
      {/* Skip Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/30 hover:text-white text-xs uppercase tracking-[0.2em] transition-colors duration-300 z-[60]"
      >
        Pular Animação
      </button>

      <div className="relative w-full max-w-lg aspect-square flex flex-col items-center justify-center">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent animate-pulse" />
        
        {/* Sprites Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            
            {/* Before Sprite */}
            <img 
                src={beforeSprite} 
                alt="Before"
                className={`absolute w-full h-full object-contain transition-all duration-300
                    ${phase === 'initial' ? 'opacity-100 scale-100 animate-bounce-slow' : ''}
                    ${phase === 'flash-start' ? 'opacity-100 brightness-[100] scale-105' : ''}
                    ${phase === 'evolving' ? 'opacity-0' : ''}
                    ${phase === 'final-flash' ? 'opacity-0' : ''}
                    ${phase === 'revealed' ? 'opacity-0' : ''}
                `}
            />

            {/* Evolving State (Flickering / Silhouette) */}
            {phase === 'evolving' && (
                <div className="relative w-full h-full animate-pulse-fast">
                    <img 
                        src={beforeSprite} 
                        className="absolute w-full h-full object-contain opacity-50 brightness-0 invert" 
                    />
                    <img 
                        src={afterSprite} 
                        className="absolute w-full h-full object-contain opacity-50 brightness-0 invert animate-ping-slow" 
                    />
                </div>
            )}

            {/* After Sprite */}
            <img 
                src={afterSprite} 
                alt="After"
                className={`absolute w-full h-full object-contain transition-all duration-1000
                    ${phase === 'revealed' ? 'opacity-100 scale-125 brightness-100' : 'opacity-0 scale-50 brightness-[100]'}
                `}
            />
            
            {/* Flash Overlay */}
            <div className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none
                ${phase === 'flash-start' ? 'opacity-80' : 'opacity-0'}
                ${phase === 'final-flash' ? 'opacity-100 duration-100' : ''}
            `} />
        </div>

        {/* Text */}
        <div className="mt-12 text-center space-y-2 z-10">
            {phase === 'initial' && (
                <p className="text-white text-xl animate-pulse">O que está acontecendo?</p>
            )}
            {phase === 'revealed' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-3xl font-bold text-yellow-400 drop-shadow-lg">
                        Parabéns!
                    </h2>
                    <p className="text-white text-lg mt-2">
                        Seu {digimonName} evoluiu para <span className="font-bold text-yellow-400">{targetName}</span>!
                    </p>
                </div>
            )}
        </div>

      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.2s infinite;
        }
      `}</style>
    </div>
  );
};

export default EvolutionAnimation;
