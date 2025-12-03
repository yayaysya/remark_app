import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A1', '#FFD700'];

const ConfettiPiece = ({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) => {
  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: 0,
        x: x,
        y: y,
        rotate: Math.random() * 360,
        scale: 0.5,
      }}
      transition={{ duration: 1.5, ease: "easeOut", delay }}
      className="absolute top-1/2 left-1/2 w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
    />
  );
};

interface ConfettiProps {
    isActive: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ isActive }) => {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * window.innerWidth * 0.8, // Scatter
        y: (Math.random() - 1) * window.innerHeight * 0.6, // Upwards mainly
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.2,
      }));
      setPieces(newPieces);
    } else {
        setPieces([]);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </div>
  );
};

export default Confetti;