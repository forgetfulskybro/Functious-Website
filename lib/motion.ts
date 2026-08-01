import { useReducedMotion, type Variants } from 'framer-motion';

export function useMotionConfig() {
  const shouldReduceMotion = useReducedMotion();
  return {
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 24 },
    animate: shouldReduceMotion ? {} : { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.4, ease: 'easeOut' },
  };
}

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};
