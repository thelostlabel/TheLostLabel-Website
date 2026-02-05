"use client";
import { motion, useScroll, useTransform } from 'framer-motion';

// Reusable Noise + Ambient Glow Background
export const PremiumBackground = ({ children }) => {
    return (
        <>
            {/* Noise Texture Filter */}
            <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
            </svg>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.04,
                filter: 'url(#noiseFilter)'
            }} />

            {/* Ambient Glows */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                    filter: 'blur(100px)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
                    filter: 'blur(120px)'
                }} />
            </div>
            {children}
        </>
    );
};

// Scroll Reveal Animation
export const ScrollReveal = ({ children, delay = 0, direction = 'up' }) => {
    const variants = {
        up: { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
        down: { hidden: { opacity: 0, y: -60 }, visible: { opacity: 1, y: 0 } },
        left: { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
        right: { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
        scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            variants={variants[direction] || variants.up}
        >
            {children}
        </motion.div>
    );
};

// Stagger Container for lists
export const StaggerContainer = ({ children, staggerDelay = 0.1 }) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                visible: { transition: { staggerChildren: staggerDelay } }
            }}
        >
            {children}
        </motion.div>
    );
};

// Individual Stagger Item
export const StaggerItem = ({ children, direction = 'up' }) => {
    const variants = {
        up: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } },
        scale: { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } } },
    };

    return (
        <motion.div variants={variants[direction] || variants.up}>
            {children}
        </motion.div>
    );
};

// Parallax Scroll Effect
export const ParallaxSection = ({ children, speed = 0.3 }) => {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

    return (
        <motion.div style={{ y }}>
            {children}
        </motion.div>
    );
};

// Horizontal Scroll Text (Marquee on steroids)
export const ScrollText = ({ text, baseVelocity = 100 }) => {
    const { scrollY } = useScroll();
    const x = useTransform(scrollY, [0, 3000], [0, -baseVelocity]);

    return (
        <motion.div
            style={{
                x,
                fontSize: 'clamp(60px, 15vw, 200px)',
                fontWeight: '900',
                color: 'rgba(255,255,255,0.02)',
                whiteSpace: 'nowrap',
                position: 'absolute',
                zIndex: 0,
                letterSpacing: '-0.04em'
            }}
        >
            {text}
        </motion.div>
    );
};
