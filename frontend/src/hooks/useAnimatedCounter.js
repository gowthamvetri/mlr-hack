import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animated number counting
 * @param {number} end - The target number to count to
 * @param {number} duration - Animation duration in milliseconds (default: 1500)
 * @param {number} startDelay - Delay before starting animation in ms (default: 0)
 * @returns {number} The current animated value
 */
export const useAnimatedCounter = (end, duration = 1500, startDelay = 0) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        // Reset when end value changes
        countRef.current = 0;
        setCount(0);

        if (end === 0) return;

        const startAnimation = () => {
            startTimeRef.current = performance.now();

            const animate = (currentTime) => {
                if (!startTimeRef.current) startTimeRef.current = currentTime;

                const elapsed = currentTime - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function: easeOutExpo for a pleasing deceleration
                const easeOutExpo = 1 - Math.pow(2, -10 * progress);
                const currentValue = Math.floor(easeOutExpo * end);

                if (currentValue !== countRef.current) {
                    countRef.current = currentValue;
                    setCount(currentValue);
                }

                if (progress < 1) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(end); // Ensure we end at exact value
                }
            };

            rafRef.current = requestAnimationFrame(animate);
        };

        const delayTimeout = setTimeout(startAnimation, startDelay);

        return () => {
            clearTimeout(delayTimeout);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [end, duration, startDelay]);

    return count;
};

export default useAnimatedCounter;
