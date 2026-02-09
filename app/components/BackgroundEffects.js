"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const Particle = ({ style, animate, transition }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={animate}
        transition={transition}
        style={{
            position: "absolute",
            width: "2px",
            height: "2px",
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 0 4px #fff",
            ...style
        }}
    />
);

export default function BackgroundEffects() {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // Move generation to a timeout to avoid synchronous blocking and satisfy linter
        const timer = setTimeout(() => {
            const generatedParticles = Array.from({ length: 30 }).map((_, i) => ({
                id: i,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                },
                animate: {
                    opacity: [0, 0.8, 0],
                    scale: [0, 1.5, 0],
                    y: [0, -40]
                },
                transition: {
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "easeInOut"
                }
            }));
            setParticles(generatedParticles);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>

            {/* 1. Deep Background Gradient */}
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 50% -20%, #252a3f 0%, #0a0a0c 60%)"
            }} />

            {/* 2. Moving Retro Grid */}
            <div className="perspective-grid" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
                <div className="moving-grid" />
            </div>

            {/* 3. Floating Orbs */}
            <div className="floating-orb" style={{
                top: "20%", left: "10%", width: "450px", height: "450px",
                background: "radial-gradient(circle, rgba(178, 255, 46, 0.18), transparent 70%)",
                animationDelay: "0s"
            }} />
            <div className="floating-orb" style={{
                bottom: "10%", right: "5%", width: "550px", height: "550px",
                background: "radial-gradient(circle, rgba(20, 180, 255, 0.15), transparent 70%)",
                animationDelay: "-5s"
            }} />
            <div className="floating-orb" style={{
                top: "50%", left: "50%", width: "350px", height: "350px",
                background: "radial-gradient(circle, rgba(255, 20, 148, 0.12), transparent 70%)",
                animationDelay: "-10s",
                transform: "translate(-50%, -50%)"
            }} />

            {/* 4. Particles / Stars */}
            <div style={{ position: "absolute", inset: 0 }}>
                {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                ))}
            </div>

        </div>
    );
}
