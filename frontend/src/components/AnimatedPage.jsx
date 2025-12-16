/**
 * AnimatedPage - Wrapper component for page-level GSAP animations
 * Wrap any page content to get smooth entry animations
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const AnimatedPage = ({
    children,
    className = '',
    animateStats = false,
    animateCards = false,
    animateList = false
}) => {
    const pageRef = useRef(null);

    useEffect(() => {
        if (!pageRef.current) return;

        const ctx = gsap.context(() => {
            // Main page fade in
            gsap.from(pageRef.current, {
                opacity: 0,
                y: 15,
                duration: 0.4,
                ease: 'power2.out'
            });

            // Animate stat cards if flag is set
            if (animateStats) {
                const statCards = pageRef.current.querySelectorAll('.stat-card, [class*="stat"]');
                if (statCards.length > 0) {
                    gsap.from(statCards, {
                        opacity: 0,
                        y: 30,
                        scale: 0.95,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: 'power3.out',
                        delay: 0.2
                    });
                }
            }

            // Animate cards with stagger
            if (animateCards) {
                const cards = pageRef.current.querySelectorAll('.card, .hover-card, [class*="rounded-2xl"]');
                if (cards.length > 0) {
                    gsap.from(cards, {
                        opacity: 0,
                        y: 25,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: 'power2.out',
                        delay: 0.15
                    });
                }
            }

            // Animate list items
            if (animateList) {
                const listItems = pageRef.current.querySelectorAll('li, .list-item, [class*="flex"][class*="gap"]');
                if (listItems.length > 0) {
                    gsap.from(listItems, {
                        opacity: 0,
                        x: -15,
                        duration: 0.4,
                        stagger: 0.05,
                        ease: 'power2.out',
                        delay: 0.2
                    });
                }
            }

            // Animate buttons
            const buttons = pageRef.current.querySelectorAll('button:not(.no-animate)');
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
                });
                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
                });
            });

        }, pageRef);

        return () => ctx.revert();
    }, [animateStats, animateCards, animateList]);

    return (
        <div ref={pageRef} className={className}>
            {children}
        </div>
    );
};

export default AnimatedPage;
