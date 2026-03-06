"use client";

import { motion } from 'framer-motion';

/**
 * Unified page loader used across all public pages (Home, Artists, Releases, etc.)
 * and the Dashboard. Provides a consistent branded loading experience.
 */
export default function PageLoader() {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="page-loader"
        >
            {/* Ambient glow */}
            <div className="page-loader-glow" />

            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="page-loader-logo"
            >
                LOST<span className="page-loader-dot">.</span>
            </motion.div>

            {/* Progress bar */}
            <motion.div className="page-loader-track">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
                    className="page-loader-bar"
                />
            </motion.div>

            {/* Subtle pulse rings */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.15, 0], scale: [0.8, 1.6, 2] }}
                transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.5 }}
                className="page-loader-ring"
            />

            <style jsx>{`
                .page-loader {
                    position: fixed;
                    inset: 0;
                    background: #050505;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .page-loader-glow {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
                    pointer-events: none;
                }

                .page-loader-logo {
                    font-size: 52px;
                    font-weight: 900;
                    letter-spacing: -2px;
                    color: #fff;
                    position: relative;
                    z-index: 2;
                    user-select: none;
                }

                .page-loader-dot {
                    color: rgba(255, 255, 255, 0.3);
                }

                .page-loader-track {
                    width: 100px;
                    height: 1.5px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 2px;
                    margin-top: 20px;
                    overflow: hidden;
                    position: relative;
                    z-index: 2;
                }

                .page-loader-bar {
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 2px;
                    transform-origin: left;
                }

                .page-loader-ring {
                    position: absolute;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    pointer-events: none;
                }
            `}</style>
        </motion.div>
    );
}
