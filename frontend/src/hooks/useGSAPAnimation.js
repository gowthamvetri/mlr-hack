/**
 * useGSAPAnimation - Custom React hook for GSAP animations
 * Provides easy-to-use animation utilities with automatic cleanup
 */

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { animationPresets, staggerPresets, animateStagger, animateElement } from '../utils/animations';

// Register GSAP with React
gsap.registerPlugin(useGSAP);

/**
 * Main animation hook - automatically animates elements on mount
 * @param {string} preset - Animation preset name from animationPresets
 * @param {object} options - Additional GSAP options
 * @returns {object} - refs and animation control methods
 */
export const useAnimateOnMount = (preset = 'fadeInUp', options = {}) => {
    const elementRef = useRef(null);

    useGSAP(() => {
        if (elementRef.current) {
            const config = animationPresets[preset] || animationPresets.fadeInUp;
            gsap.from(elementRef.current, {
                ...config,
                ...options
            });
        }
    }, { scope: elementRef, dependencies: [] });

    return elementRef;
};

/**
 * Stagger animation hook - animates multiple children with stagger
 * @param {string} selector - CSS selector for children to animate
 * @param {string} preset - Animation preset
 * @param {string} stagger - Stagger preset name
 * @param {object} options - Additional options
 */
export const useStaggerAnimation = (selector = '.animate-item', preset = 'fadeInUp', stagger = 'normal', options = {}) => {
    const containerRef = useRef(null);

    useGSAP(() => {
        if (containerRef.current) {
            const elements = containerRef.current.querySelectorAll(selector);
            if (elements.length > 0) {
                const config = animationPresets[preset] || animationPresets.fadeInUp;
                const staggerConfig = staggerPresets[stagger] || staggerPresets.normal;

                gsap.from(elements, {
                    ...config,
                    stagger: staggerConfig,
                    ...options
                });
            }
        }
    }, { scope: containerRef, dependencies: [] });

    return containerRef;
};

/**
 * Timeline animation hook - for complex sequential animations
 * @returns {object} - containerRef and timeline reference
 */
export const useTimeline = (options = {}) => {
    const containerRef = useRef(null);
    const timelineRef = useRef(null);

    useGSAP(() => {
        timelineRef.current = gsap.timeline({
            defaults: {
                duration: 0.5,
                ease: 'power3.out'
            },
            ...options
        });

        return () => {
            if (timelineRef.current) {
                timelineRef.current.kill();
            }
        };
    }, { scope: containerRef });

    return { containerRef, timeline: timelineRef };
};

/**
 * Counter animation hook - animates numbers counting up
 * @param {number} endValue - Target value to count to
 * @param {object} options - Additional options
 */
export const useCounterAnimation = (endValue, options = {}) => {
    const elementRef = useRef(null);
    const { duration = 1.5, delay = 0, startValue = 0, formatter = Math.round } = options;

    useGSAP(() => {
        if (elementRef.current && endValue !== undefined) {
            const obj = { value: startValue };
            gsap.to(obj, {
                value: endValue,
                duration,
                delay,
                ease: 'power2.out',
                onUpdate: () => {
                    if (elementRef.current) {
                        elementRef.current.textContent = formatter(obj.value);
                    }
                }
            });
        }
    }, { scope: elementRef, dependencies: [endValue] });

    return elementRef;
};

/**
 * Hover animation hook - adds smooth hover effects
 * @param {object} hoverState - Properties to animate on hover
 * @param {object} normalState - Properties for normal state
 */
export const useHoverAnimation = (hoverState = { scale: 1.05 }, normalState = { scale: 1 }) => {
    const elementRef = useRef(null);

    const handleMouseEnter = useCallback(() => {
        if (elementRef.current) {
            gsap.to(elementRef.current, {
                ...hoverState,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }, [hoverState]);

    const handleMouseLeave = useCallback(() => {
        if (elementRef.current) {
            gsap.to(elementRef.current, {
                ...normalState,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }, [normalState]);

    return {
        ref: elementRef,
        handlers: {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave
        }
    };
};

/**
 * Page transition hook - animates page content on mount
 */
export const usePageTransition = () => {
    const pageRef = useRef(null);

    useGSAP(() => {
        if (pageRef.current) {
            // Animate the page container
            gsap.from(pageRef.current, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                ease: 'power3.out'
            });

            // Animate children with stagger
            const children = pageRef.current.querySelectorAll('.animate-on-load');
            if (children.length > 0) {
                gsap.from(children, {
                    opacity: 0,
                    y: 30,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    delay: 0.2
                });
            }
        }
    }, { scope: pageRef, dependencies: [] });

    return pageRef;
};

/**
 * Stats cards animation - specifically for dashboard stat cards
 */
export const useStatsAnimation = () => {
    const containerRef = useRef(null);

    useGSAP(() => {
        if (containerRef.current) {
            const cards = containerRef.current.querySelectorAll('.stat-card');

            gsap.from(cards, {
                opacity: 0,
                y: 40,
                scale: 0.95,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out'
            });

            // Animate the numbers inside cards
            const numbers = containerRef.current.querySelectorAll('.stat-number');
            numbers.forEach((num) => {
                const endValue = parseInt(num.textContent) || 0;
                const obj = { value: 0 };
                gsap.to(obj, {
                    value: endValue,
                    duration: 1.5,
                    delay: 0.5,
                    ease: 'power2.out',
                    onUpdate: () => {
                        num.textContent = Math.round(obj.value);
                    }
                });
            });
        }
    }, { scope: containerRef, dependencies: [] });

    return containerRef;
};

/**
 * List animation - animates list items with stagger
 */
export const useListAnimation = (options = {}) => {
    const listRef = useRef(null);
    const { selector = 'li, .list-item', ...gsapOptions } = options;

    useGSAP(() => {
        if (listRef.current) {
            const items = listRef.current.querySelectorAll(selector);
            if (items.length > 0) {
                gsap.from(items, {
                    opacity: 0,
                    x: -20,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: 'power2.out',
                    ...gsapOptions
                });
            }
        }
    }, { scope: listRef, dependencies: [] });

    return listRef;
};

export default useAnimateOnMount;
