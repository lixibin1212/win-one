import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SunAnimation = () => {
    const [phase, setPhase] = useState<'moving' | 'exploded'>('moving');

    // Restart animation loop
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (phase === 'exploded') {
            // Wait for stars to fade out before restarting
            timer = setTimeout(() => {
                setPhase('moving');
            }, 4500);
        }
        return () => clearTimeout(timer);
    }, [phase]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 20, // Ensure it's above most things
            overflow: 'hidden'
        }}>
            <AnimatePresence mode='wait'>
                {phase === 'moving' && (
                    <Sun onComplete={() => setPhase('exploded')} />
                )}
            </AnimatePresence>
            {phase === 'exploded' && <Stars originX={65} originY={28} />}
        </div>
    );
};

// Generate points for a Quadratic Bezier Curve (Parabola)
const generateParabolaPoints = (p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }, segments: number) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
        points.push({ x, y });
    }
    return points;
};

const Sun = ({ onComplete }: { onComplete: () => void }) => {
    // Define trajectory points
    // P0: Start (Bottom Left)
    // P1: Control Point (Top Left-ish to create the arc)
    // P2: End (Target Area near "Understand" text)
    const p0 = { x: 5, y: 85 };
    const p1 = { x: 30, y: -10 }; // Pull up high
    const p2 = { x: 65, y: 28 }; // Landing spot

    const trajectory = useMemo(() => generateParabolaPoints(p0, p1, p2, 50), []);

    const xValues = trajectory.map(p => `${p.x}vw`);
    const yValues = trajectory.map(p => `${p.y}vh`);

    return (
        <motion.div
            initial={{ x: xValues[0], y: yValues[0], opacity: 0, scale: 0.5 }}
            animate={{
                x: xValues,
                y: yValues,
                opacity: [0, 1, 1, 1],
                scale: [0.6, 1, 1.2, 0.4], // Grow then shrink at the very end
                // Color transition: Blue halo -> White halo
                // We map this to the progress of the animation
                boxShadow: [
                    "0 0 20px 8px rgba(59, 130, 246, 0.8)", // Blue halo (start)
                    "0 0 25px 10px rgba(59, 130, 246, 0.6)", // Blue halo (mid)
                    "0 0 30px 12px rgba(255, 255, 255, 0.9)", // White halo (near end)
                    "0 0 10px 5px rgba(255, 255, 255, 1)"    // Intense white (impact)
                ]
            }}
            transition={{
                duration: 2.5,
                ease: "linear", // Linear because the points themselves define the curve easing
                times: [0, 0.2, 0.8, 1] // Adjust opacity/scale timing if needed, but linear path is safest
            }}
            onAnimationComplete={onComplete}
            style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
            }}
        />
    );
};

const Stars = ({ originX, originY }: { originX: number, originY: number }) => {
    // Generate a "pile" of stars
    const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => {
        // Random spread logic for "sprinkling to the right"
        // Mostly going right (positive x), and falling down (positive y)
        // Some parabolic arc for them too would be nice, but linear move is okay for explosion
        const angle = (Math.random() * 90 - 45) * (Math.PI / 180); // -45 to +45 degrees (mostly right)
        const velocity = Math.random() * 15 + 10;

        return {
            id: i,
            destX: originX + Math.cos(angle) * velocity + Math.random() * 10, // Move right
            destY: originY + Math.sin(angle) * velocity + Math.random() * 20 + 5, // Move down/right
            delay: Math.random() * 0.2,
            scale: Math.random() * 0.6 + 0.4,
            rotation: Math.random() * 360,
            duration: Math.random() * 1.5 + 1
        };
    }), [originX, originY]);

    return (
        <>
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    initial={{
                        left: `${originX}vw`,
                        top: `${originY}vh`,
                        opacity: 1,
                        scale: 0,
                        rotate: 0
                    }}
                    animate={{
                        left: `${star.destX}vw`,
                        top: `${star.destY}vh`,
                        opacity: [1, 1, 0],
                        scale: [0, star.scale, 0],
                        rotate: star.rotation
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        ease: "easeOut"
                    }}
                    style={{
                        position: 'absolute',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#fff',
                        // Star shape clip-path
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                        boxShadow: '0 0 6px rgba(255, 255, 255, 0.9)'
                    }}
                />
            ))}
        </>
    );
};

export default SunAnimation;
