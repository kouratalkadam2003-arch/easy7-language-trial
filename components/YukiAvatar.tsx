
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicrophoneIcon, YukiSenseiIcon } from './icons';

interface YukiAvatarProps {
    currentStage: string;
    isSpeaking: boolean;
    currentAction?: string; // e.g., 'jump_text', 'climb_button'
    onCommand?: (command: string) => void;
}

export const YukiAvatar: React.FC<YukiAvatarProps> = ({ currentStage, isSpeaking, currentAction, onCommand }) => {
    // Position state: x, y in percentages (0-100)
    const [pos, setPos] = useState({ x: 85, y: 85 });
    const [isMoving, setIsMoving] = useState(false);
    const [isJumping, setIsJumping] = useState(false);
    const [facingRight, setFacingRight] = useState(false);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    
    // For "Look At" logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isMoving) return;
            const charX = (pos.x / 100) * window.innerWidth;
            const charY = (pos.y / 100) * window.innerHeight;
            
            // Calculate angle to look at mouse
            const dx = e.clientX - charX;
            const dy = e.clientY - charY;
            
            // Simple head tracking
            const rotY = Math.min(Math.max(dx / 50, -20), 20);
            const rotX = Math.min(Math.max(-dy / 50, -10), 10);
            
            setRotation({ x: rotX, y: rotY });
            setFacingRight(dx > 0);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [pos, isMoving]);

    // Movement Logic based on Stage/Action
    useEffect(() => {
        const moveRandomly = () => {
            if (isMoving || currentAction) return;
            // Random subtle movement when idle
            const newX = Math.max(10, Math.min(90, pos.x + (Math.random() - 0.5) * 10));
            const newY = Math.max(10, Math.min(90, pos.y + (Math.random() - 0.5) * 10));
            moveTo(newX, newY);
        };

        const interval = setInterval(moveRandomly, 8000);
        return () => clearInterval(interval);
    }, [pos, isMoving, currentAction]);

    // Respond to AI Actions
    useEffect(() => {
        if (!currentAction) return;

        if (currentAction === 'jump_text' || currentStage === 'story') {
            // Move to top center area (where text usually is)
            moveTo(50, 20, true);
        } else if (currentAction === 'climb_button' || currentStage === 'game') {
            // Move to bottom center (options area)
            moveTo(50, 70, true);
        } else if (currentAction === 'hide') {
            moveTo(95, 95);
        } else if (currentAction === 'center') {
            moveTo(50, 50, true);
        }
    }, [currentAction, currentStage]);

    const moveTo = (targetX: number, targetY: number, jump: boolean = false) => {
        setIsMoving(true);
        if (jump) setIsJumping(true);
        
        // Determine direction
        setFacingRight(targetX > pos.x);

        // Calculate duration based on distance
        const dist = Math.sqrt(Math.pow(targetX - pos.x, 2) + Math.pow(targetY - pos.y, 2));
        const duration = dist * 20 + 500; // ms

        setTimeout(() => {
            setPos({ x: targetX, y: targetY });
            setTimeout(() => {
                setIsMoving(false);
                setIsJumping(false);
            }, duration);
        }, 100);
    };

    // Speech Animation (Bobbing)
    const bounceStyle = isSpeaking ? 'animate-bounce-fast' : 'animate-float';

    return (
        <div 
            className="fixed z-[100] pointer-events-none transition-all duration-[1500ms] ease-in-out"
            style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%)`,
            }}
        >
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes bounce-fast {
                    0%, 100% { transform: translateY(0px) scale(1.05); }
                    50% { transform: translateY(-5px) scale(0.95); }
                }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-bounce-fast { animation: bounce-fast 0.3s ease-in-out infinite; }
                .yuki-3d-wrapper {
                    perspective: 600px;
                }
                .yuki-sprite {
                    transform-style: preserve-3d;
                    backface-visibility: hidden;
                    filter: drop-shadow(0px 10px 5px rgba(0,0,0,0.3));
                }
            `}</style>

            <div className={`yuki-3d-wrapper relative w-32 h-32 md:w-48 md:h-48 ${isJumping ? 'scale-125 transition-transform duration-500' : ''}`}>
                <div 
                    className={`yuki-sprite w-full h-full ${bounceStyle} cursor-pointer pointer-events-auto`}
                    style={{
                        transform: `
                            rotateY(${facingRight ? 180 + rotation.y : rotation.y}deg) 
                            rotateX(${rotation.x}deg)
                            scale(${scale})
                            translateZ(0px)
                        `,
                        transition: 'transform 0.2s ease-out'
                    }}
                    onClick={() => {
                        // Playful reaction on click
                        setScale(1.2);
                        setTimeout(() => setScale(1), 200);
                        // Could trigger voice listening here
                    }}
                >
                    <YukiSenseiIcon />
                </div>
                
                {/* Shadow */}
                <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-purple-900/20 rounded-[100%] blur-sm transition-all duration-500"
                    style={{
                        transform: `scale(${isJumping ? 0.5 : 1})`,
                        opacity: isJumping ? 0.5 : 1
                    }}
                />
            </div>

             {/* Speech Bubble (Optional) */}
             {isSpeaking && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-pink-600 whitespace-nowrap shadow-sm animate-pulse">
                    Speaking... 🔊
                </div>
            )}
        </div>
    );
};
