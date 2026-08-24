import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars, Cloud, Sparkles, Text, Billboard, KeyboardControls, useKeyboardControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, Vector3 } from '../store';

const VILLAIN_MAX_HEALTH = 100;

function VillainGuard({ item }: { item: any }) {
  const attackVillain = useStore(state => state.attackVillain);
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.05;
      ref.current.position.y = item.position.y + Math.sin(state.clock.elapsedTime * 5) * 0.2;
    }
  });

  if (!item.isGuarded) return null;

  const healthPercent = item.guardHealth / VILLAIN_MAX_HEALTH;

  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      <mesh 
        ref={ref} 
        onPointerOver={() => setHover(true)} 
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          attackVillain(item.id);
        }}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={hovered ? "orange" : "red"} emissive="darkred" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      <mesh position={[-0.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      <Billboard position={[0, 1.2, 0]}>
        <Text fontSize={0.2} color="white" outlineColor="black" outlineWidth={0.02}>
          Health: {item.guardHealth}
        </Text>
        {/* Health Bar Background */}
        <mesh position={[0, -0.2, 0]}>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="gray" />
        </mesh>
        {/* Health Bar Foreground */}
        <mesh position={[-0.5 + (1 * healthPercent) / 2, -0.2, 0.01]}>
          <planeGeometry args={[1 * healthPercent, 0.1]} />
          <meshBasicMaterial color={healthPercent > 0.5 ? "green" : "red"} />
        </mesh>
      </Billboard>
    </group>
  );
}

function TextureErrorBoundary({ children, fallbackUrl }: { children: React.ReactNode, fallbackUrl: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    );
  }

  return <React.Suspense fallback={<group />}>{children}</React.Suspense>;
}

function QuestItemView({ item }: { item: any }) {
  const collectItem = useStore(state => state.collectItem);
  const playerPosition = useStore(state => state.playerPosition);
  const [hovered, setHover] = useState(false);

  const dx = playerPosition.x - item.position.x;
  const dz = playerPosition.z - item.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  const canCollect = !item.isGuarded && distance < 2.5;

  if (item.collected) return null;

  return (
    <group position={[item.position.x, item.position.y - 0.5, item.position.z]}>
      {item.isGuarded ? (
        <Billboard position={[0, 1.5, 0]}>
          <Text fontSize={0.4} color="gray" outlineWidth={0.02} outlineColor="black">?</Text>
        </Billboard>
      ) : (
        <Billboard position={[0, 1, 0]}>
          <group 
            onPointerOver={() => setHover(true)} 
            onPointerOut={() => setHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (canCollect) collectItem(item.id);
            }}
          >
            <mesh>
              <planeGeometry args={[1.5, 1.5]} />
              <meshBasicMaterial color={canCollect ? (hovered ? "#4ade80" : "white") : "gray"} />
            </mesh>
            
            <Html center position={[0, 0, 0.1]}>
               <div className="w-32 h-32 flex flex-col items-center justify-center p-1 bg-white rounded-md shadow-lg" style={{ pointerEvents: 'none' }}>
                 <p className="font-bold text-center text-xs m-0 p-0 text-black">{item.sound}</p>
                 <img src={item.imageUrl} alt={item.arabicObject} className="w-20 h-20 object-cover mt-1 rounded border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
               </div>
            </Html>

            {canCollect && (
              <Text position={[0, -1, 0.1]} fontSize={0.2} color="yellow" outlineWidth={0.02} outlineColor="black">
                إضغط للجمع
              </Text>
            )}
            {!canCollect && (
              <Text position={[0, -1, 0.1]} fontSize={0.15} color="#ffaa00" outlineWidth={0.02} outlineColor="black">
                اقترب أكثر للجمع
              </Text>
            )}
          </group>
        </Billboard>
      )}
    </group>
  );
}

function Player() {
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const playerPosition = useStore(state => state.playerPosition);
  const playerTargetPosition = useStore(state => state.playerTargetPosition);
  const setPlayerPosition = useStore(state => state.setPlayerPosition);
  const setPlayerTargetPosition = useStore(state => state.setPlayerTargetPosition);

  useFrame((state, delta) => {
    const { forward, backward, left, right } = getKeys();
    const speed = 5 * delta;

    let targetX = playerTargetPosition.x;
    let targetZ = playerTargetPosition.z;

    if (forward) targetZ -= speed;
    if (backward) targetZ += speed;
    if (left) targetX -= speed;
    if (right) targetX += speed;

    if (forward || backward || left || right) {
        setPlayerTargetPosition({ x: targetX, y: 0.5, z: targetZ });
    }

    // Smooth movement
    const newX = THREE.MathUtils.lerp(playerPosition.x, playerTargetPosition.x, 0.1);
    const newZ = THREE.MathUtils.lerp(playerPosition.z, playerTargetPosition.z, 0.1);
    
    setPlayerPosition({ x: newX, y: 0.5, z: newZ });
    
    state.camera.position.x = newX;
    state.camera.position.z = newZ + 5;
    state.camera.position.y = 3;
    state.camera.lookAt(newX, 0, newZ);
  });

  return (
    <mesh position={[playerPosition.x, playerPosition.y, playerPosition.z]}>
      <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}

function Environment() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Cloud position={[-4, 2, -4]} speed={0.2} opacity={0.5} />
      <Cloud position={[4, 2, -5]} speed={0.2} opacity={0.5} />
      <Sparkles count={200} scale={12} size={2} speed={0.4} color="#a855f7" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d1b4e" roughness={0.8} />
      </mesh>
    </>
  );
}

// Intercept clicks on the floor to move the player
function ClickableFloor() {
  const setPlayerTargetPosition = useStore(state => state.setPlayerTargetPosition);
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.01, 0]} 
      onClick={(e) => {
        setPlayerTargetPosition({ x: e.point.x, y: 0.5, z: e.point.z });
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function World() {
  const items = useStore(state => state.questItems);
  
  return (
    <div className="w-full h-full relative cursor-crosshair">
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded text-sm mix-blend-difference pointer-events-none">
        استخدم WASD أو انقر للحركة 🖱️ <br/>
        انقر على الوحوش لهزيمتهم ⚔️
      </div>
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        ]}
      >
        <Canvas>
          <Environment />
          <ClickableFloor />
          <Player />
          {items.map(item => (
            <group key={item.id}>
              <VillainGuard item={item} />
              <QuestItemView item={item} />
            </group>
          ))}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
