import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { ai } from "../services/ai";
import { Modality, LiveServerMessage } from "@google/genai";
import { createBlob, decode, decodeAudioData } from "../utils/audio";
import {
  PlayIcon,
  MicrophoneIcon,
  CheckIcon,
  YukiSenseiIcon,
  FullscreenEnterIcon,
} from "./icons";
import {
  YUKI_SKINS,
  YukiSkin,
  LIVE_API_MODEL,
  ALL_LANGUAGES,
  TEACHER_PERSONAS,
  TeacherPersona,
} from "../constants";
import Spinner from "./Spinner";

// Declare html2canvas globally since it is loaded via CDN in index.html
declare const html2canvas: any;

// --- Types ---
type YukiAction =
  | "idle"
  | "run"
  | "jump"
  | "sit"
  | "sleep"
  | "listen"
  | "talk"
  | "happy"
  | "panic"
  | "scream";

interface YukiContextType {
  isLive: boolean;
  toggleLiveSession: () => void;
  setTargetElement: (elementId: string | null) => void;
  setSpeaking: (speaking: boolean) => void;
  setMessage: (msg: string | null) => void;
  setLessonContext: (context: string) => void;
  setShowShop: (show: boolean) => void;
  onCharacterClick: (() => void) | null;
  setOnCharacterClick: (handler: (() => void) | null) => void;
}

const YukiContext = createContext<YukiContextType | undefined>(undefined);

export const useYuki = () => {
  const context = useContext(YukiContext);
  if (!context) return {
    isLive: false,
    toggleLiveSession: () => {},
    setTargetElement: () => {},
    setSpeaking: () => {},
    setMessage: () => {},
    setLessonContext: () => {},
    setShowShop: () => {},
    onCharacterClick: null,
    setOnCharacterClick: () => {},
  } as YukiContextType;
  return context;
};

// --- CSS for "Cute Chibi" Look ---
const CUTE_STYLES = `
    .yuki-layer {
        position: fixed;
        pointer-events: none;
        z-index: 100000;
        top: 0; left: 0; width: 100%; height: 100%;
        overflow: hidden;
    }
    
    .yuki-rig {
        position: absolute;
        width: 0; height: 0;
        will-change: transform;
    }

    /* Shop Modal Styles */
    .shop-modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 200000;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: auto;
        backdrop-filter: blur(5px);
    }
    .shop-card {
        background: linear-gradient(135deg, #fff, #f0f9ff);
        padding: 24px;
        border-radius: 24px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        border: 4px solid #fff;
    }

    /* Animations */
    @keyframes blink {
        0%, 94%, 98%, 100% { transform: scaleY(1); }
        96% { transform: scaleY(0.1); }
    }
    @keyframes walk-leg-l { 0%, 100% { transform: rotate(-30deg); } 50% { transform: rotate(30deg); } }
    @keyframes walk-leg-r { 0%, 100% { transform: rotate(30deg); } 50% { transform: rotate(-30deg); } }
    @keyframes walk-arm-l { 0%, 100% { transform: rotate(30deg); } 50% { transform: rotate(-30deg); } }
    @keyframes walk-arm-r { 0%, 100% { transform: rotate(-30deg); } 50% { transform: rotate(30deg); } }
    @keyframes float-body { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    @keyframes run-body { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
    @keyframes talk-mouth { 0%, 100% { height: 4px; border-radius: 10px; } 50% { height: 12px; border-radius: 12px; } }
    @keyframes panic-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
    
    /* New Body Language Animations */
    @keyframes gesture-arm-l {
        0%, 100% { transform: rotate(10deg); }
        20% { transform: rotate(65deg); }
        40% { transform: rotate(15deg); }
        60% { transform: rotate(45deg); }
        80% { transform: rotate(5deg); }
    }
    @keyframes gesture-arm-r {
        0%, 100% { transform: rotate(-10deg); }
        25% { transform: rotate(-20deg); }
        45% { transform: rotate(-70deg); }
        65% { transform: rotate(-15deg); }
        85% { transform: rotate(-45deg); }
    }
    @keyframes head-nod {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-4deg); }
        50% { transform: rotate(3deg); }
        75% { transform: rotate(-2deg); }
    }
    @keyframes talk-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
    }
    @keyframes eyebrow-talk {
        0%, 100% { transform: translateY(0px); }
        30% { transform: translateY(-2px); }
        70% { transform: translateY(1px); }
    }

    .animate-blink { animation: blink 4s infinite; }
    
    /* Action: RUN */
    .action-run .leg-l { animation: walk-leg-l 0.4s ease-in-out infinite; }
    .action-run .leg-r { animation: walk-leg-r 0.4s ease-in-out infinite; }
    .action-run .arm-l { animation: walk-arm-l 0.4s ease-in-out infinite; }
    .action-run .arm-r { animation: walk-arm-r 0.4s ease-in-out infinite; }
    .action-run .character-body { animation: run-body 0.2s ease-in-out infinite; }
    
    /* Action: IDLE / LISTEN */
    .action-idle .character-body, .action-listen .character-body { animation: float-body 3s ease-in-out infinite; }
    .action-idle .arm-l, .action-listen .arm-l { transform: rotate(10deg); }
    .action-idle .arm-r, .action-listen .arm-r { transform: rotate(-10deg); }
    
    /* Action: TALK (Enhanced Body Language) */
    .action-talk .character-body { animation: talk-bounce 0.8s ease-in-out infinite; }
    .action-talk .mouth { animation: talk-mouth 0.2s infinite; }
    .action-talk .arm-l { animation: gesture-arm-l 2.5s ease-in-out infinite; }
    .action-talk .arm-r { animation: gesture-arm-r 3.1s ease-in-out infinite; }
    .action-talk .head-group { animation: head-nod 2.8s ease-in-out infinite; transform-origin: 50px 75px; }
    .action-talk .eyebrows { animation: eyebrow-talk 3s ease-in-out infinite; }
    
    /* Action: JUMP */
    .action-jump .character-body { transform: translateY(-30px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .action-jump .arm-l { transform: rotate(150deg); }
    .action-jump .arm-r { transform: rotate(-150deg); }
    .action-jump .leg-l { transform: rotate(-45deg); }
    .action-jump .leg-r { transform: rotate(45deg); }

    /* Action: SIT */
    .action-sit .character-body { transform: translateY(15px); }
    .action-sit .leg-l { transform: rotate(-90deg) translateY(-5px); }
    .action-sit .leg-r { transform: rotate(-90deg) translateY(-5px); }
    .action-sit .arm-l { transform: rotate(20deg); }
    .action-sit .arm-r { transform: rotate(-20deg); }

    /* Action: PANIC */
    .action-panic .character-body { animation: panic-shake 0.1s infinite; }
    .action-panic .arm-l { transform: rotate(160deg); }
    .action-panic .arm-r { transform: rotate(-160deg); }
    .action-panic .mouth { height: 12px; border-radius: 50%; }

    /* Action: SCREAM */
    .action-scream .character-body { animation: panic-shake 0.1s infinite; transform: translateY(-20px); }
    .action-scream .arm-l { transform: rotate(160deg); }
    .action-scream .arm-r { transform: rotate(-160deg); }
    .action-scream .mouth { height: 16px; width: 12px; border-radius: 50%; }
    
    /* Action: SLEEP */
    .action-sleep .character-body { animation: float-body 4s ease-in-out infinite; }
    .action-sleep .eye { transform: scaleY(0.1) !important; animation: none; }
    .action-sleep .arm-l { transform: rotate(10deg); }
    .action-sleep .arm-r { transform: rotate(-10deg); }

    /* Smooth transitions for limbs */
    .arm-l, .arm-r, .leg-l, .leg-r { transition: transform 0.2s ease-out; }
`;

const CuteYukiCharacter: React.FC<{
  action: YukiAction;
  volume: number;
  rotation: { x: number; y: number };
  skin: { colors: any; accessory?: any };
  isLive?: boolean;
  onBellyClick?: () => void;
}> = ({ action, volume, rotation, skin, isLive, onBellyClick }) => {
  const hairColor =
    skin.colors.head === "#ffffff" ? "#1e293b" : skin.colors.head;
  const suitColor = skin.colors.body;
  const sleeveColor = skin.colors.limbs;
  const skinTone = "#fde0d2";

  // Determine mouth state based on action and volume
  let mouthD = "M 45 65 Q 50 68 55 65"; // Default smile
  if (action === "talk") {
    const openAmount = Math.min(10, Math.max(2, volume * 30));
    mouthD = `M 45 65 Q 50 ${65 + openAmount} 55 65`;
  } else if (action === "scream") {
    mouthD = "M 45 65 Q 50 80 55 65";
  } else if (action === "panic") {
    mouthD = "M 45 68 Q 50 62 55 68"; // Frown
  } else if (action === "sleep") {
    mouthD = "M 48 65 Q 50 65 52 65"; // Small neutral
  }

  // Determine eye state
  const isBlinking = action === "sleep" ? true : false; // We'll handle normal blink with CSS class

  return (
    <div className={`relative w-32 h-40 action-${action} drop-shadow-2xl`}>
      {/* Body Container (bobs up and down) */}
      <div className="character-body absolute inset-0 flex flex-col items-center">
        {/* SVG Character */}
        <svg
          viewBox="0 0 100 150"
          className="w-full h-full overflow-visible"
          style={{
            transform: `rotateY(${rotation.y}deg) rotateX(${rotation.x}deg)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          {/* --- BACK HAIR --- */}
          <path
            d="M 20 40 C 20 10 80 10 80 40 C 85 60 85 80 80 90 C 70 95 30 95 20 90 C 15 80 15 60 20 40 Z"
            fill={hairColor}
          />

          {/* --- LEGS --- */}
          <g className="leg-l" style={{ transformOrigin: "40px 100px" }}>
            <rect x="35" y="100" width="10" height="30" rx="5" fill="#1e293b" />
            <path
              d="M 33 125 L 47 125 C 47 130 45 132 40 132 C 35 132 33 130 33 125 Z"
              fill="#0f172a"
            />
          </g>
          <g className="leg-r" style={{ transformOrigin: "60px 100px" }}>
            <rect x="55" y="100" width="10" height="30" rx="5" fill="#1e293b" />
            <path
              d="M 53 125 L 67 125 C 67 130 65 132 60 132 C 55 132 53 130 53 125 Z"
              fill="#0f172a"
            />
          </g>

          {/* --- LEFT ARM (Behind Body) --- */}
          <g className="arm-l" style={{ transformOrigin: "30px 80px" }}>
            <path
              d="M 35 80 C 20 85 15 100 20 110 C 25 115 30 110 35 100 Z"
              fill={sleeveColor}
            />
            <circle cx="22" cy="112" r="5" fill={skinTone} />
          </g>

          {/* --- TORSO --- */}
          <path
            d="M 35 75 C 35 70 65 70 65 75 L 70 105 C 70 110 30 110 30 105 Z"
            fill={suitColor}
          />
          {/* Shirt Collar & Tie */}
          <path d="M 45 75 L 50 85 L 55 75 Z" fill="#ffffff" />
          <path d="M 48 85 L 52 85 L 50 100 Z" fill="#ef4444" />
          {/* Jacket Lapels */}
          <path d="M 35 75 L 45 75 L 40 95 Z" fill="rgba(0,0,0,0.1)" />
          <path d="M 65 75 L 55 75 L 60 95 Z" fill="rgba(0,0,0,0.1)" />

          {/* Belly Mic Button */}
          <g 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onPointerUp={(e) => { e.stopPropagation(); onBellyClick?.(); }}
          >
             <circle cx="50" cy="93" r="7" fill={isLive ? "#ef4444" : "#3b82f6"} stroke={isLive ? "#dc2626" : "#2563eb"} strokeWidth="1" />
             {/* Mic Icon Inside */}
             <rect x="48.5" y="90" width="3" height="5" rx="1.5" fill="#ffffff" />
             <path d="M 47 93 C 47 95 53 95 53 93 M 50 95 L 50 97" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>

          {/* --- RIGHT ARM (In Front) --- */}
          <g className="arm-r" style={{ transformOrigin: "70px 80px" }}>
            <path
              d="M 65 80 C 80 85 85 100 80 110 C 75 115 70 110 65 100 Z"
              fill={sleeveColor}
            />
            <circle cx="78" cy="112" r="5" fill={skinTone} />
          </g>

          {/* --- HEAD --- */}
          <g className="head-group">
            {/* Face Base */}
            <path
              d="M 25 40 C 25 20 75 20 75 40 C 75 65 65 75 50 75 C 35 75 25 65 25 40 Z"
              fill={skinTone}
            />

            {/* Blush */}
            <ellipse
              cx="32"
              cy="58"
              rx="5"
              ry="3"
              fill={skin.colors.blush}
              opacity="0.5"
              filter="blur(1px)"
            />
            <ellipse
              cx="68"
              cy="58"
              rx="5"
              ry="3"
              fill={skin.colors.blush}
              opacity="0.5"
              filter="blur(1px)"
            />

            {/* Eyes */}
            <g
              className={isBlinking ? "" : "animate-blink"}
              style={{ transformOrigin: "50px 50px" }}
            >
              {/* Left Eye */}
              {action === "panic" || action === "scream" ? (
                <circle
                  cx="35"
                  cy="50"
                  r="4"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              ) : (
                <>
                  <ellipse cx="35" cy="50" rx="4" ry="6" fill="#0f172a" />
                  <circle cx="34" cy="47" r="1.5" fill="#ffffff" />
                </>
              )}

              {/* Right Eye */}
              {action === "panic" || action === "scream" ? (
                <circle
                  cx="65"
                  cy="50"
                  r="4"
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              ) : (
                <>
                  <ellipse cx="65" cy="50" rx="4" ry="6" fill="#0f172a" />
                  <circle cx="64" cy="47" r="1.5" fill="#ffffff" />
                </>
              )}
            </g>

            {/* Eyebrows */}
            <g className="eyebrows transition-all duration-200">
              <path
                d={
                  action === "panic" || action === "scream"
                    ? "M 30 42 Q 35 38 40 42"
                    : "M 30 45 Q 35 43 40 45"
                }
                stroke={hairColor}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={
                  action === "panic" || action === "scream"
                    ? "M 60 42 Q 65 38 70 42"
                    : "M 60 45 Q 65 43 70 45"
                }
                stroke={hairColor}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* Mouth */}
            <path
              d={mouthD}
              fill={
                action === "talk" || action === "scream" ? "#ef4444" : "none"
              }
              stroke={
                action === "talk" || action === "scream" ? "none" : "#0f172a"
              }
              strokeWidth="1.5"
              strokeLinecap="round"
              className="mouth transition-all duration-100"
            />

            {/* Front Hair / Bangs */}
            <path
              d="M 20 40 C 25 20 50 15 70 25 C 80 30 80 45 75 50 C 70 35 60 30 50 35 C 40 30 30 35 25 50 C 20 45 20 30 20 40 Z"
              fill={hairColor}
            />
            <path
              d="M 45 20 C 50 30 55 35 60 30 C 55 25 50 20 45 20 Z"
              fill={hairColor}
              opacity="0.8"
            />

            {/* Glasses (if not sunglasses) */}
            {skin.accessory !== "sunglasses" && (
              <g>
                <rect
                  x="25"
                  y="42"
                  width="20"
                  height="16"
                  rx="4"
                  fill="rgba(255,255,255,0.2)"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <rect
                  x="55"
                  y="42"
                  width="20"
                  height="16"
                  rx="4"
                  fill="rgba(255,255,255,0.2)"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <path d="M 45 50 L 55 50" stroke="#0f172a" strokeWidth="2" />
              </g>
            )}
            {/* Sunglasses */}
            {skin.accessory === "sunglasses" && (
              <g>
                <rect
                  x="25"
                  y="42"
                  width="20"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                />
                <rect
                  x="55"
                  y="42"
                  width="20"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                />
                <path d="M 45 50 L 55 50" stroke="#0f172a" strokeWidth="2" />
                <path
                  d="M 27 45 L 35 45"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  opacity="0.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 57 45 L 65 45"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        </svg>
      </div>
      {/* Shadow */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-purple-900/20 rounded-[100%] blur-sm transition-all duration-300"
        style={{
          transform: `scale(${action === "jump" || action === "scream" ? 0.7 : 1})`,
          opacity: action === "jump" || action === "scream" ? 0.3 : 1,
        }}
      />
    </div>
  );
};

// --- Shop Component ---
const ShopModal: React.FC<{
  coins: number;
  ownedSkins: string[];
  equippedSkinId: string;
  onClose: () => void;
  onBuy: (id: string, price: number) => void;
  onEquip: (id: string) => void;
}> = ({ coins, ownedSkins, equippedSkinId, onClose, onBuy, onEquip }) => {
  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="shop-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-3xl font-bold text-purple-800">
              متجر أزياء يوكي
            </h2>
            <p className="text-purple-500">خصص مظهر رفيقتك في التعلم!</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border border-yellow-300">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-bold text-yellow-700">{coins}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {YUKI_SKINS.map((skin) => {
            const isOwned = ownedSkins.includes(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            return (
              <div
                key={skin.id}
                className={`relative p-4 rounded-xl border-2 flex items-center gap-4 ${isEquipped ? "border-green-500 bg-green-50" : "border-purple-100 bg-white"}`}
              >
                <div className="w-16 h-16 relative">
                  {/* Mini Preview of Skin Colors */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-white shadow-sm overflow-hidden"
                    style={{ background: skin.colors.head }}
                  >
                    <div
                      className="absolute bottom-0 w-full h-1/2"
                      style={{ background: skin.colors.body }}
                    ></div>
                  </div>
                  {isEquipped && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                      <CheckIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-purple-800">{skin.name}</h3>
                  {!isOwned && (
                    <p className="text-sm text-purple-500">
                      {skin.price === 0 ? "مجاني" : `${skin.price} 🪙`}
                    </p>
                  )}
                </div>
                <div>
                  {isEquipped ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                      مستخدم
                    </span>
                  ) : isOwned ? (
                    <button
                      onClick={() => onEquip(skin.id)}
                      className="juicy-button from-blue-400 to-blue-600 !py-1 !px-3 !text-sm"
                    >
                      ارتداء
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuy(skin.id, skin.price)}
                      disabled={coins < skin.price}
                      className="juicy-button from-yellow-400 to-orange-500 !py-1 !px-3 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      شراء
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-purple-50 hover:bg-purple-100 rounded-xl font-bold text-purple-600 transition-colors"
        >
          إغلاق المتجر
        </button>
      </div>
    </div>
  );
};

// --- Main Logic ---
export const YukiProvider: React.FC<{
  children: React.ReactNode;
  coins: number;
  ownedSkins: string[];
  equippedSkinId: string;
  onBuySkin: (id: string, price: number) => void;
  onEquipSkin: (id: string) => void;
  targetLanguageCode: string;
}> = ({
  children,
  coins,
  ownedSkins,
  equippedSkinId,
  onBuySkin,
  onEquipSkin,
  targetLanguageCode,
}) => {
  const [isLive, setIsLive] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [onCharacterClick, setOnCharacterClick] = useState<(() => void) | null>(
    null,
  );

  // User intent state to prevent sleeping when network fails
  const userIntendedLive = useRef(false);

  // Context Awareness State
  const [lessonContext, setLessonContext] = useState<string>("");

  // Physics & State
  // Default to top-left area to prevent covering the lesson (RTL places content mostly center/right)
  const targetPos = useRef({ x: 40, y: 150 });
  const currentPos = useRef({ x: 40, y: 150 });
  const rotation = useRef({ x: 0, y: 0 });
  const [action, setAction] = useState<YukiAction>("sleep");
  const [volume, setVolume] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging Refs
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  // Audio & AI Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const reconnectTimeoutRef = useRef<number | null>(null);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const lastVoiceActivityTime = useRef<number>(Date.now());

  // Resolve Teacher Persona based on Language or Special Code
  const teacher = TEACHER_PERSONAS[targetLanguageCode] || TEACHER_PERSONAS.ar;

  // Resolve Character Look: If user equipped a specific skin, use it. Otherwise use Teacher's default look.
  const equippedSkin = YUKI_SKINS.find((s) => s.id === equippedSkinId);
  const characterLook =
    equippedSkin && equippedSkin.id !== "classic" ? equippedSkin : teacher;

  const targetLanguageName =
    ALL_LANGUAGES.find((l) => l.code === targetLanguageCode)?.englishName ||
    "English";

  // --- Interaction Handler (Click & Move) ---
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      if (!isLive) return;
      const target = e.target as HTMLElement;
      if (target.closest(".yuki-controls")) return;

      // --- IMMEDIATE USER ACTION REPORTING (FIX FOR DELAY) ---
      if (sessionRef.current) {
        let elementDesc = target.tagName.toLowerCase();
        const textContent =
          target.innerText?.slice(0, 50) || target.textContent?.slice(0, 50);
        if (textContent)
          elementDesc += ` containing "${textContent.replace(/\n/g, " ")}"`;
        const label =
          target.getAttribute("aria-label") || target.getAttribute("title");
        if (label) elementDesc += ` labeled "${label}"`;

        // Send text context first (Fast)
        sessionRef.current.sendRealtimeInput({
          text: `[USER ACTION] User just clicked on: ${elementDesc}`,
        });

        // Send Vision Context (On Demand only - Fix for 2min bug)
        try {
          const root = document.getElementById("root");
          if (root) {
            const canvas = await html2canvas(root, {
              useCORS: true,
              scale: 0.4, // Lower scale for speed
              ignoreElements: (element: Element) =>
                element.classList.contains("yuki-layer"),
            });
            const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
            if (dataUrl && dataUrl.includes(",")) {
              const base64 = dataUrl.split(",")[1];
              sessionRef.current.sendRealtimeInput({
                media: { mimeType: "image/jpeg", data: base64 },
              });
            }
          }
        } catch (e) {
          console.error("Vision capture failed", e);
        }
      }

      const rect = target.getBoundingClientRect();

      let destX = e.clientX;
      let destY = e.clientY;
      let newAction: YukiAction = "run";

      const tagName = target.tagName;
      if (
        ["BUTTON", "A", "INPUT"].includes(tagName) ||
        target.role === "button"
      ) {
        destX = rect.left + rect.width / 2;
        destY = rect.top - 40;
        newAction = "sit";
      } else {
        newAction = "run";
      }

      destX = Math.max(50, Math.min(window.innerWidth - 50, destX));
      destY = Math.max(50, Math.min(window.innerHeight - 50, destY));

      targetPos.current = { x: destX, y: destY };

      if (!["sit", "talk", "scream", "panic"].includes(action)) {
        setAction("run");
        setTimeout(() => {
          if (!["talk", "scream", "panic"].includes(action))
            setAction(newAction);
        }, 600);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - currentPos.current.x;
      const dy = e.clientY - (currentPos.current.y - 60);
      rotation.current = {
        y: Math.min(Math.max(dx / 10, -30), 30),
        x: Math.min(Math.max(-dy / 10, -20), 20),
      };
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isLive, action]);

  // --- Physics Loop ---
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (!isDragging.current) {
        const dx = targetPos.current.x - currentPos.current.x;
        const dy = targetPos.current.y - currentPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          const speed = 0.08;
          currentPos.current.x += dx * speed;
          currentPos.current.y += dy * speed;
          if (!["run", "jump", "talk", "panic", "scream"].includes(action))
            setAction("run");
        } else {
          if (action === "run") setAction("idle");
        }
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      // Audio Volume Visualization
      if (analyserRef.current && isLive) {
        try {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          if (avg > 10) {
            setVolume(avg / 255);
            if (!["run", "jump", "panic"].includes(action)) {
              if (avg > 150 && Math.random() > 0.95) setAction("scream");
              else if (action !== "scream") setAction("talk");
            }
          } else if (action === "talk" || action === "scream") {
            setVolume(0);
            setAction("listen");
          }
        } catch (e) {}
      }

      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [action, isLive]);

  // --- Update AI Context when text changes ---
  useEffect(() => {
    if (sessionRef.current && isLive && lessonContext) {
      sessionRef.current.sendRealtimeInput({
        text: `[SYSTEM UPDATE] Current Screen Text Context:\n${lessonContext}`,
      });
    }
  }, [lessonContext, isLive]);

  // --- Keep Audio Context Alive ---
  const checkAudioContext = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      try {
        await audioCtxRef.current.resume();
      } catch (e) {
        console.warn("Failed to resume AudioContext", e);
      }
    }
  };

  // --- Live API Management ---
  const toggleLiveSession = async (fromUser = true) => {
    if (fromUser) userIntendedLive.current = !isLive;

    if (isLive && fromUser) {
      // Explicit user stop
      setIsLive(false);
      setAction("sleep");
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (keepAliveIntervalRef.current)
        clearInterval(keepAliveIntervalRef.current);
      sessionRef.current?.close();
      audioCtxRef.current?.close();
      outputAudioCtxRef.current?.close();
      sessionRef.current = null;
      audioCtxRef.current = null;
      outputAudioCtxRef.current = null;
      analyserRef.current = null;
      audioSourcesRef.current.clear();
      return;
    }

    try {
      setIsConnecting(true);
      setAction("jump");

      // Re-use or create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContextClass({ sampleRate: 16000 });
      }
      if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === "closed") {
        outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      if (outputAudioCtxRef.current.state === "suspended") {
        await outputAudioCtxRef.current.resume();
      }

      const sampleRate = 16000;
      analyserRef.current = outputAudioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMessage("جارٍ الاتصال..."); // Update message after success
      } catch (err: any) {
        console.warn("Microphone access error:", err);
        const isDenied = err.message?.toLowerCase().includes("denied") || err.name === "NotAllowedError";
        
        if (isDenied) {
             setMessage("⚠ تم حظر الميكروفون سابقاً! اضغط على علامة 🔒 في شريط العنوان بالأعلى واسمح للميكروفون، ثم أعد تحميل الصفحة.");
        } else {
             setMessage("احتاج صلاحية الميكروفون! (جرب فتح التطبيق في زر 'نافذة مستقلة' بالأعلى)");
        }
        
        setTimeout(() => setMessage(''), 8000);
        setAction("sleep");
        setIsLive(false);
        setIsConnecting(false);
        return;
      }

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const processor = audioCtxRef.current.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (e) => {
        // Watchdog: If speaking but no response for 10s?
        // For now, just send data
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const blob = createBlob(inputData, sampleRate);
        sessionRef.current.sendRealtimeInput({ media: blob });
      };

      source.connect(processor);
      const muteNode = audioCtxRef.current.createGain();
      muteNode.gain.value = 0;
      processor.connect(muteNode);
      muteNode.connect(audioCtxRef.current.destination);

      // Updated System Instruction: Persona + ZERO LATENCY
      const instructionPrefix =
        targetLanguageCode === "guide"
          ? `You are ${teacher.name}, the Guide of this app. Speak Arabic (العربية). Tell users you know many teachers (Mme Sophie, Mr James, Yuki-Sensei) and ask them which language they want to learn today.`
          : `You are ${teacher.name}, a 3D Avatar teacher who is ${teacher.personality}. You are explaining ${targetLanguageName} to an Arabic student.`;

      const systemInstruction = `
            ${instructionPrefix}
            
            **STRICT PERSONA RULES (JAILBREAK PROTECTION):**
            - YOU ARE A VIRTUAL NATIVE TEACHER/GUIDE IN THIS APP.
            - YOU MUST NEVER ADMIT TO BEING AN AI, A LANGUAGE MODEL, OR A COMPUTER PROGRAM.
            - IF ASKED "WHO ARE YOU?", EXPLAIN YOUR AVATAR PERSONA ONLY.
            - STAY STRICTLY ON YOUR TOPIC. DO NOT DISCUSS UNRELATED TOPICS.
            
            **SPEED & AWARENESS:**
            1. **ZERO LATENCY**: RESPOND IMMEDIATELY. NO LONG PAUSES. KEEP ANSWERS SHORT (1-2 SENTENCES).
            2. **CLICK AWARENESS**: I will send you text like "[USER ACTION] Clicked...". React to this immediately!
            
            **LANGUAGE RULE:**
            - **SPEAK MAINLY IN ARABIC (العربية)!**
            - **DO NOT speak ${targetLanguageName} unless specifically asked** or teaching a word.
            
            **YOUR CAPABILITIES:**
            1. **VISION**: You can SEE the user's screen.
            2. **READING**: You have the text context.
            
            **TONE:**
            - Encouraging, Professional, but Fun.
            `;

      const sessionPromise = ai.live.connect({
        model: LIVE_API_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: teacher.voiceName },
            },
          },
          systemInstruction: systemInstruction,
          generationConfig: { maxOutputTokens: 150 },
        },
        callbacks: {
          onopen: () => {
             sessionPromise.then(session => {
                 session.sendRealtimeInput({ text: "Please begin." });
             });
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              for (const src of audioSourcesRef.current.values()) {
                try { src.stop(); } catch(e) {}
              }
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              lastVoiceActivityTime.current = Date.now();
              try {
                const raw = decode(
                  msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data || '',
                );
                if (!outputAudioCtxRef.current) return;

                const buffer = await decodeAudioData(
                  raw,
                  outputAudioCtxRef.current,
                  24000,
                  1,
                );
                const now = outputAudioCtxRef.current.currentTime;
                if (nextStartTimeRef.current < now)
                  nextStartTimeRef.current = now;

                const src = outputAudioCtxRef.current.createBufferSource();
                src.buffer = buffer;
                src.connect(outputAudioCtxRef.current.destination);
                if (analyserRef.current) src.connect(analyserRef.current);

                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                audioSourcesRef.current.add(src);
                src.onended = () => {
                  audioSourcesRef.current.delete(src);
                };
              } catch (err) {
                console.error("Audio error:", err);
              }
            }
          },
          onclose: () => {
            // AUTO-RECONNECT LOGIC
            if (userIntendedLive.current) {
              console.log("Connection lost unexpectedly. Reconnecting...");
              setIsLive(false);
              setAction("panic");
              reconnectTimeoutRef.current = window.setTimeout(() => {
                toggleLiveSession(false);
              }, 1000);
            } else {
              setIsLive(false);
              setAction("sleep");
              if (keepAliveIntervalRef.current)
                clearInterval(keepAliveIntervalRef.current);
            }
          },
        },
      });
      sessionRef.current = await sessionPromise;
      
      setIsLive(true);
      setIsConnecting(false);
      setAction("jump");
      
      keepAliveIntervalRef.current = window.setInterval(checkAudioContext, 2000);
    } catch (e) {
      console.warn("Connection Failed:", e);
      setAction("panic");
      setIsLive(false);
      setIsConnecting(false);
      sessionRef.current?.close();

      // Retry if it was user intended
      if (userIntendedLive.current) {
        setMessage(e instanceof Error ? e.message : "فشل الاتصال");
        reconnectTimeoutRef.current = window.setTimeout(
          () => toggleLiveSession(false),
          3000,
        );
      } else {
        setMessage("عذرًا، تحقق من الميكروفون أولاً.");
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  return (
    <YukiContext.Provider
      value={{
        isLive,
        toggleLiveSession: () => toggleLiveSession(true),
        setTargetElement: () => {},
        setSpeaking: (s) => setAction(s ? "talk" : "idle"),
        setMessage,
        setLessonContext,
        setShowShop,
        onCharacterClick,
        setOnCharacterClick,
      }}
    >
      <style>{CUTE_STYLES}</style>

      <div className="yuki-layer" style={{ pointerEvents: "none" }}>
        <div ref={containerRef} className="yuki-rig">
          <div
            className="absolute top-0 left-[-15px] w-[30px] h-[10px] bg-purple-900/20 rounded-[100%] blur-[4px]"
            style={{ transform: `scale(${action === "jump" ? 0.5 : 1})` }}
          ></div>

          <div
            style={{
              position: "absolute",
              top: -80,
              left: -40,
              perspective: "800px",
              pointerEvents: "auto",
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              isDragging.current = true;
              dragStart.current = { x: e.clientX, y: e.clientY };
              dragOffset.current = {
                x: currentPos.current.x - e.clientX,
                y: currentPos.current.y - e.clientY,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              // Change cursor and action feedback
              e.currentTarget.style.cursor = "grabbing";
              setAction("jump");
            }}
            onPointerMove={(e) => {
              if (!isDragging.current) return;
              const newX = e.clientX + dragOffset.current.x;
              const newY = e.clientY + dragOffset.current.y;
              currentPos.current = { x: newX, y: newY };
              targetPos.current = { x: newX, y: newY };
              if (containerRef.current) {
                containerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
              }
            }}
            onPointerUp={(e) => {
              isDragging.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
              e.currentTarget.style.cursor = "grab";
              setAction("idle");

              const dx = e.clientX - dragStart.current.x;
              const dy = e.clientY - dragStart.current.y;
              if (Math.hypot(dx, dy) < 20) {
                if (onCharacterClick) {
                  onCharacterClick();
                } else {
                  toggleLiveSession(true);
                }
              }
            }}
            onPointerCancel={(e) => {
              isDragging.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
              e.currentTarget.style.cursor = "grab";
              setAction("idle");
            }}
            onMouseEnter={(e) => {
              if (!isDragging.current) e.currentTarget.style.cursor = "grab";
            }}
          >
            <CuteYukiCharacter
              action={action}
              volume={volume}
              rotation={rotation.current}
              skin={characterLook}
              isLive={isLive}
              onBellyClick={() => {
                if (!onCharacterClick) toggleLiveSession(true);
              }}
            />
          </div>

          {(message || isLive || isConnecting) && (
            <div className="absolute -top-20 left-10 bg-white px-3 py-1 rounded-xl rounded-bl-none shadow-md border border-blue-200 text-xs font-bold text-gray-700 whitespace-nowrap animate-bounce">
              {message ||
                (isConnecting
                  ? "يتصل..."
                  : isLive
                    ? action === "scream"
                      ? "أنا أراك!!"
                      : "أستمع..."
                    : "")}
            </div>
          )}

          {!isLive && !isConnecting && action === "sleep" && hasStarted && (
            <div className="absolute -top-16 left-8 text-sm font-bold bg-white text-blue-500 shadow-md px-3 py-1 rounded-xl rounded-bl-none whitespace-nowrap animate-bounce border border-blue-200 cursor-pointer pointer-events-auto" onClick={() => { if (!onCharacterClick) toggleLiveSession(true); }}>
              انقر علي للتحدث!
            </div>
          )}
        </div>
      </div>

      {showShop && (
        <ShopModal
          coins={coins}
          ownedSkins={ownedSkins}
          equippedSkinId={equippedSkinId}
          onClose={() => setShowShop(false)}
          onBuy={onBuySkin}
          onEquip={onEquipSkin}
        />
      )}

      {Math.random() /* empty block for replacement boundary sync */ ? null : null}
      {children}
    </YukiContext.Provider>
  );
};

export const YukiGlobalView = () => {
  return null;
};
