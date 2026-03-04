import { useMemo } from 'react'

const PETAL_COUNT = 15
const SPARKLE_COUNT = 12

function Petal({ index }) {
    const config = useMemo(() => ({
        size: 6 + Math.random() * 10,
        startX: Math.random() * 100,
        duration: 9 + Math.random() * 8,
        delay: Math.random() * 12,
        drift: (Math.random() - 0.5) * 120,
        opacity: 0.12 + Math.random() * 0.15,
        rotation: Math.random() * 720,
        variant: index % 3,
    }), [index])

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left: `${config.startX}%`,
                top: '-3%',
                width: `${config.size}px`,
                height: `${config.size}px`,
                background: config.variant === 0
                    ? `rgba(183, 110, 121, ${config.opacity})`
                    : config.variant === 1
                        ? `rgba(212, 175, 55, ${config.opacity * 0.7})`
                        : `rgba(230, 184, 192, ${config.opacity * 0.8})`,
                borderRadius: config.variant === 2 ? '50%' : '150% 0 150% 0',
                animation: `petalFallV${config.variant} ${config.duration}s ease-in-out ${config.delay}s infinite`,
                filter: `blur(${config.variant === 2 ? 1 : 0}px)`,
            }}
        />
    )
}

function Sparkle({ index }) {
    const config = useMemo(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
    }), [index])

    return (
        <div
            className="absolute pointer-events-none rounded-full"
            style={{
                left: `${config.x}%`,
                top: `${config.y}%`,
                width: `${config.size}px`,
                height: `${config.size}px`,
                background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(183,110,121,0.3) 50%, transparent 70%)',
                animation: `sparkleGlow ${config.duration}s ease-in-out ${config.delay}s infinite`,
            }}
        />
    )
}

export default function FloatingPetals() {
    return (
        <>
            <style>{`
                @keyframes petalFallV0 {
                    0% { transform: translate(0, -5vh) rotate(0deg) scale(0.7); opacity: 0; }
                    5% { opacity: 0.5; }
                    50% { opacity: 0.3; }
                    100% { transform: translate(60px, 110vh) rotate(540deg) scale(0.2); opacity: 0; }
                }
                @keyframes petalFallV1 {
                    0% { transform: translate(0, -5vh) rotate(45deg) scale(0.5); opacity: 0; }
                    8% { opacity: 0.35; }
                    100% { transform: translate(-50px, 112vh) rotate(650deg) scale(0.15); opacity: 0; }
                }
                @keyframes petalFallV2 {
                    0% { transform: translate(0, -3vh) scale(0.4); opacity: 0; }
                    10% { opacity: 0.3; }
                    50% { transform: translate(30px, 55vh) scale(0.6); opacity: 0.15; }
                    100% { transform: translate(80px, 108vh) scale(0.2); opacity: 0; }
                }
                @keyframes sparkleGlow {
                    0%, 100% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {Array.from({ length: PETAL_COUNT }, (_, i) => (
                    <Petal key={`p-${i}`} index={i} />
                ))}
                {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
                    <Sparkle key={`s-${i}`} index={i} />
                ))}
            </div>
        </>
    )
}
