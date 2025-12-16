/**
 * AnimatedCard - Card component with GSAP hover animations
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const AnimatedCard = ({
    children,
    className = '',
    hoverScale = 1.02,
    hoverY = -5,
    onClick,
    delay = 0
}) => {
    const cardRef = useRef(null);

    useEffect(() => {
        if (!cardRef.current) return;

        // Entry animation
        gsap.from(cardRef.current, {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.6,
            delay,
            ease: 'power3.out'
        });

        const card = cardRef.current;

        const handleEnter = () => {
            gsap.to(card, {
                scale: hoverScale,
                y: hoverY,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                duration: 0.3,
                ease: 'power2.out'
            });
        };

        const handleLeave = () => {
            gsap.to(card, {
                scale: 1,
                y: 0,
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                duration: 0.3,
                ease: 'power2.out'
            });
        };

        card.addEventListener('mouseenter', handleEnter);
        card.addEventListener('mouseleave', handleLeave);

        return () => {
            card.removeEventListener('mouseenter', handleEnter);
            card.removeEventListener('mouseleave', handleLeave);
        };
    }, [hoverScale, hoverY, delay]);

    return (
        <div
            ref={cardRef}
            className={`transition-colors ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </div>
    );
};

export default AnimatedCard;
