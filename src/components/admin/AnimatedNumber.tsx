import React, { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  isCurrency?: boolean;
  className?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, isCurrency, className }) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  const displayValue = useTransform(springValue, (latest) => {
    if (isCurrency) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Math.round(latest));
    }
    return Math.round(latest).toLocaleString('vi-VN');
  });

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span className={className}>{displayValue}</motion.span>;
};

export default AnimatedNumber;
