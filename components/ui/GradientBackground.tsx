'use client';
import { motion } from 'framer-motion';

export default function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #0D0505 0%, #7B1515 15%, #A52F05 40%, #C44010 65%, #D45510 85%, #7B1515 100%)',
        }}
        animate={{
          scale: [1, 1.08, 1.04, 1],
          x: [0, 16, -12, 0],
          y: [0, -12, 8, 0],
        }}
        transition={{
          duration: 12,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />

      <div className="absolute inset-0 bg-[#0D0505]/30" />
    </div>
  );
}
