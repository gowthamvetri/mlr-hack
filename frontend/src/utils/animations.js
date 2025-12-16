/**
 * GSAP Animation Utilities
 * Provides reusable animation presets and effects
 */

import gsap from 'gsap';

// Register GSAP plugins if needed
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(ScrollTrigger);

/**
 * Animation Presets - Common animation configurations
 */
export const animationPresets = {
    // Fade animations
    fadeIn: {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    },
    fadeInUp: {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power3.out'
    },
    fadeInDown: {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: 'power3.out'
    },
    fadeInLeft: {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: 'power3.out'
    },
    fadeInRight: {
        opacity: 0,
        x: 30,
        duration: 0.6,
        ease: 'power3.out'
    },

    // Scale animations
    scaleIn: {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: 'back.out(1.7)'
    },
    scaleInBounce: {
        opacity: 0,
        scale: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)'
    },

    // Slide animations
    slideInUp: {
        y: 50,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    },
    slideInDown: {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    },

    // Card/stat animations
    cardReveal: {
        opacity: 0,
        y: 40,
        scale: 0.95,
        duration: 0.7,
        ease: 'power3.out'
    },

    // Number counter animation settings
    countUp: {
        duration: 1.5,
        ease: 'power2.out'
    }
};

/**
 * Stagger Settings
 */
export const staggerPresets = {
    fast: { each: 0.05 },
    normal: { each: 0.1 },
    slow: { each: 0.15 },
    cards: { each: 0.12, from: 'start' },
    grid: { each: 0.08, grid: 'auto', from: 'start' },
    random: { each: 0.1, from: 'random' }
};

/**
 * Animate elements with stagger effect
 */
export const animateStagger = (elements, preset = 'fadeInUp', stagger = 'normal', options = {}) => {
    const animConfig = animationPresets[preset] || animationPresets.fadeInUp;
    const staggerConfig = staggerPresets[stagger] || staggerPresets.normal;

    return gsap.from(elements, {
        ...animConfig,
        stagger: staggerConfig,
        ...options
    });
};

/**
 * Animate a single element
 */
export const animateElement = (element, preset = 'fadeInUp', options = {}) => {
    if (!element) return null;
    const animConfig = animationPresets[preset] || animationPresets.fadeInUp;
    return gsap.from(element, { ...animConfig, ...options });
};

/**
 * Animate to a state
 */
export const animateTo = (element, toProps = {}, options = {}) => {
    if (!element) return null;
    return gsap.to(element, {
        duration: 0.5,
        ease: 'power2.out',
        ...toProps,
        ...options
    });
};

/**
 * Create a timeline for complex animations
 */
export const createTimeline = (options = {}) => {
    return gsap.timeline({
        defaults: {
            duration: 0.5,
            ease: 'power3.out'
        },
        ...options
    });
};

/**
 * Animate number counting up
 */
export const animateCounter = (element, endValue, options = {}) => {
    if (!element) return null;

    const obj = { value: 0 };
    return gsap.to(obj, {
        value: endValue,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
            element.textContent = Math.round(obj.value);
        },
        ...options
    });
};

/**
 * Hover animation helper
 */
export const createHoverAnimation = (element, hoverProps = { scale: 1.05, duration: 0.3 }) => {
    if (!element) return { enter: () => { }, leave: () => { } };

    const enter = () => gsap.to(element, { ...hoverProps, ease: 'power2.out' });
    const leave = () => gsap.to(element, { scale: 1, duration: 0.3, ease: 'power2.out' });

    return { enter, leave };
};

/**
 * Page transition animation (fade out current, fade in new)
 */
export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
    exit: { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }
};

export default gsap;
