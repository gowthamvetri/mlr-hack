import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

/**
 * Animated Number Component - displays a number with count-up animation
 * @param {number} value - The number to display
 * @param {number} duration - Animation duration in ms (default: 1500)
 * @param {number} delay - Delay before animation starts in ms (default: 0)
 * @param {string} suffix - Optional suffix like '%' or 'k'
 * @param {string} prefix - Optional prefix like '$'
 * @param {string} className - Optional CSS classes
 */
const AnimatedNumber = ({
    value,
    duration = 1500,
    delay = 0,
    suffix = '',
    prefix = '',
    className = ''
}) => {
    const animatedValue = useAnimatedCounter(value || 0, duration, delay);

    return (
        <span className={className}>
            {prefix}{animatedValue.toLocaleString()}{suffix}
        </span>
    );
};

export default AnimatedNumber;
