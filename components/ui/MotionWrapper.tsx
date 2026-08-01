'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useMotionConfig } from '@/lib/motion';

interface MotionWrapperProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function MotionWrapper({
  children,
  delay,
  className,
}: MotionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const motionConfig = useMotionConfig();

  const transition = delay
    ? { ...motionConfig.transition, delay }
    : motionConfig.transition;

  return (
    <motion.div
      ref={ref}
      initial={motionConfig.initial}
      animate={isInView ? motionConfig.animate : motionConfig.initial}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
