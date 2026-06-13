import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    className = '',
    delay = 0,
    direction = 'up',
}) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '-80px',
                threshold: 0.1,
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    const directionOffset = {
        up: 'translate-y-6',
        down: '-translate-y-6',
        left: 'translate-x-6',
        right: '-translate-x-6',
    };

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}s` }}
            className={[
                'transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] will-change-transform',
                isInView ? 'translate-x-0 translate-y-0 opacity-100' : `opacity-0 ${directionOffset[direction]}`,
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
};

export default ScrollReveal;
