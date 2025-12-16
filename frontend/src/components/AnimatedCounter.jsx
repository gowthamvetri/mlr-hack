/**
 * AnimatedCounter - Animated number counter using GSAP
 */

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

const AnimatedCounter = ({
    value,
    duration = 1.5,
    delay = 0,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = ''
}) => {
    const counterRef = useRef(null);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (counterRef.current && value !== undefined) {
            const obj = { value: 0 };

            gsap.to(obj, {
                value: value,
                duration: duration,
                delay: delay,
                ease: 'power2.out',
                onUpdate: () => {
                    setDisplayValue(decimals > 0
                        ? obj.value.toFixed(decimals)
                        : Math.round(obj.value)
                    );
                }
            });
        }
    }, [value, duration, delay, decimals]);

    return (
        <span ref={counterRef} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    );
};

export default AnimatedCounter;
