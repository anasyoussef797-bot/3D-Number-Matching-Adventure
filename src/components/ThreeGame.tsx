import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ObjectType, Language } from '../types';

interface ThreeGameProps {
  targetNumber: number;
  options: number[];
  objectType: ObjectType;
  currentLanguage: Language;
  onSelectOption: (count: number) => void;
  isCorrect: boolean | null;
  soundEnabled: boolean;
}

export const ThreeGame: React.FC<ThreeGameProps> = ({
  targetNumber,
  options,
  objectType,
  currentLanguage,
  onSelectOption,
  isCorrect,
  soundEnabled
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References to keep track of Three.js objects for animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const optionIslandsRef = useRef<THREE.Group[]>([]);
  const mainIslandRef = useRef<THREE.Group | null>(null);
  const numberCardRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const celebrationConfettiRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Interaction variables
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Shake animations state
  const shakeIslandIndex = useRef<number | null>(null);
  const shakeTime = useRef<number>(0);

  // Dynamic texture generator for the large, glowing target number
  const createNumberTexture = (num: number, lang: Language) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Premium background: translucent glassmorphism card
    ctx.clearRect(0, 0, 512, 512);

    // Gorgeous rounded gold border card
    const r = 40;
    const x = 32, y = 32, w = 448, h = 448;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // Gradient fill (Clean Minimalism: charcoal with a signature mint border)
    const cardGrad = ctx.createLinearGradient(0, 0, 512, 512);
    cardGrad.addColorStop(0, '#2d3436');
    cardGrad.addColorStop(1, '#1e2527');
    ctx.fillStyle = cardGrad;
    ctx.fill();

    // Elegant mint accent stroke
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#00b894';
    ctx.stroke();

    // Glowing shadow for the text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;

    // Beautiful typography selection
    ctx.fillStyle = '#FFFFFF'; // High contrast white text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Set font based on English/Arabic/etc
    const useArabic = lang === 'ar';
    ctx.font = useArabic ? 'bold 220px "Cairo", "Inter", sans-serif' : 'bold 240px "Space Grotesk", "Inter", sans-serif';

    // Localize the digit display (convert to Arabic numerals if Arabic language is chosen)
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    const displayNum = useArabic 
      ? num.toString().split('').map(digit => arabicDigits[parseInt(digit)] || digit).join('')
      : num.toString();

    ctx.fillText(displayNum, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Build colorful 3D objects procedurally to ensure perfect 60fps high-fidelity realistic feel
  const createProceduralObject = (type: ObjectType): THREE.Group => {
    const group = new THREE.Group();

    switch (type) {
      case 'apples': {
        // High-gloss wax shiny realistic red apple
        const bodyGeo = new THREE.SphereGeometry(0.24, 24, 24);
        bodyGeo.scale(1, 0.95, 1); // Slightly flattened top-to-bottom for realistic organic shape
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: 0xef4444, 
          roughness: 0.1, 
          metalness: 0.05,
          flatShading: false
        });
        const appleMesh = new THREE.Mesh(bodyGeo, bodyMat);
        appleMesh.castShadow = true;
        group.add(appleMesh);

        // Apple bottom calyx (tiny black cylinder)
        const calyxGeo = new THREE.CylinderGeometry(0.015, 0.03, 0.03, 5);
        const calyxMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
        const calyx = new THREE.Mesh(calyxGeo, calyxMat);
        calyx.position.y = -0.22;
        group.add(calyx);

        // Brown wood stem
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.14, 8);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.25;
        stem.rotation.z = 0.25;
        group.add(stem);

        // Beautiful organic green leaf with veins look (using curved shape)
        const leafGeo = new THREE.SphereGeometry(0.06, 12, 12);
        leafGeo.scale(1.5, 0.5, 0.2); // Flattened leaf
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.08, 0.26, 0);
        leaf.rotation.set(0.2, 0, -0.6);
        group.add(leaf);
        break;
      }
      case 'stars': {
        // High-fidelity 5-pointed 3D Star constructed using 5 gold cones!
        // This looks incredibly realistic and stunningly beautiful!
        const starGroup = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ 
          color: 0xffd700, // Metallic Gold
          roughness: 0.15,
          metalness: 0.95, // High metalness for actual gold reflections!
        });

        // 5 points of the star
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5;
          const coneGeo = new THREE.ConeGeometry(0.09, 0.28, 5);
          const cone = new THREE.Mesh(coneGeo, goldMat);
          
          cone.position.set(Math.sin(angle) * 0.14, Math.cos(angle) * 0.14, 0);
          cone.rotation.z = -angle; // Point outward
          starGroup.add(cone);
        }

        // Center pentagon fill
        const centerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 5);
        centerGeo.rotateX(Math.PI / 2);
        const center = new THREE.Mesh(centerGeo, goldMat);
        starGroup.add(center);

        starGroup.traverse(child => {
          if (child instanceof THREE.Mesh) child.castShadow = true;
        });
        group.add(starGroup);
        break;
      }
      case 'balloons': {
        // Extremely glossy metallic child balloons
        const balloonColors = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0x9b59b6];
        const randomColor = balloonColors[Math.floor(Math.random() * balloonColors.length)];

        // High gloss metallic standard material
        const bMat = new THREE.MeshStandardMaterial({ 
          color: randomColor,
          roughness: 0.05, // Highly reflective!
          metalness: 0.65, // Metallic foil look!
        });

        const bGeo = new THREE.SphereGeometry(0.24, 24, 24);
        bGeo.scale(1, 1.25, 1); // Natural drop shape
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.castShadow = true;
        group.add(bMesh);

        // Tie knot
        const knotGeo = new THREE.ConeGeometry(0.04, 0.06, 6);
        const knot = new THREE.Mesh(knotGeo, bMat);
        knot.position.y = -0.31;
        knot.rotation.x = Math.PI;
        group.add(knot);

        // Thread/string (flexible wave shape using cylinder)
        const threadGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.38, 4);
        const threadMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        const thread = new THREE.Mesh(threadGeo, threadMat);
        thread.position.y = -0.5;
        thread.rotation.z = 0.08; // Natural slant
        group.add(thread);
        break;
      }
      case 'blocks': {
        // High-fidelity LEGO-like bricks with 4 studs on top!
        const blockColors = [0xe84118, 0x00a8ff, 0xfbc531, 0x4cd137, 0xe15f41];
        const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];
        const brickMat = new THREE.MeshStandardMaterial({ 
          color: randomColor, 
          roughness: 0.15,
          metalness: 0.1
        });

        // Main block base
        const brickGeo = new THREE.BoxGeometry(0.38, 0.22, 0.38);
        const brick = new THREE.Mesh(brickGeo, brickMat);
        brick.castShadow = true;
        brick.receiveShadow = true;
        group.add(brick);

        // 4 studs on top of the Lego block
        const studGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12);
        const studPositions = [
          [-0.1, 0.12, -0.1],
          [0.1, 0.12, -0.1],
          [-0.1, 0.12, 0.1],
          [0.1, 0.12, 0.1]
        ];

        studPositions.forEach(([sx, sy, sz]) => {
          const stud = new THREE.Mesh(studGeo, brickMat);
          stud.position.set(sx, sy, sz);
          stud.castShadow = true;
          group.add(stud);
        });
        break;
      }
      case 'fish': {
        // Detailed realistic goldfish with multiple fins and glowing scales!
        const fishGroup = new THREE.Group();
        const fishMat = new THREE.MeshStandardMaterial({ 
          color: 0xff7f50, // Coral Goldfish orange
          roughness: 0.2,
          metalness: 0.45
        });

        // Fat fish body
        const fishGeo = new THREE.SphereGeometry(0.22, 16, 16);
        fishGeo.scale(1.4, 1.0, 0.65); // Elliptic body
        const body = new THREE.Mesh(fishGeo, fishMat);
        body.castShadow = true;
        fishGroup.add(body);

        // Beautiful flowing tail fin
        const tailGeo = new THREE.ConeGeometry(0.12, 0.24, 6);
        tailGeo.scale(1, 1, 0.2); // Flat tail
        const tail = new THREE.Mesh(tailGeo, fishMat);
        tail.position.set(-0.34, -0.02, 0);
        tail.rotation.z = Math.PI / 1.7; // Tilted backwards
        fishGroup.add(tail);

        // Dorsal fin on top
        const dorsalGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
        dorsalGeo.scale(1, 1, 0.2);
        const dorsal = new THREE.Mesh(dorsalGeo, fishMat);
        dorsal.position.set(0.04, 0.2, 0);
        dorsal.rotation.z = -Math.PI / 4;
        fishGroup.add(dorsal);

        // Left and right pectoral fins
        const finGeo = new THREE.ConeGeometry(0.05, 0.12, 4);
        finGeo.scale(1, 1, 0.2);
        
        const finL = new THREE.Mesh(finGeo, fishMat);
        finL.position.set(0.1, -0.08, 0.16);
        finL.rotation.set(0.5, 0, -0.5);
        
        const finR = new THREE.Mesh(finGeo, fishMat);
        finR.position.set(0.1, -0.08, -0.16);
        finR.rotation.set(-0.5, 0, -0.5);
        
        fishGroup.add(finL);
        fishGroup.add(finR);

        // Big shiny eyes
        const eyeWhiteGeo = new THREE.SphereGeometry(0.045, 10, 10);
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        const eyeBlackGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });

        // Left eye
        const eL1 = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eL1.position.set(0.18, 0.06, 0.14);
        const eL2 = new THREE.Mesh(eyeBlackGeo, eyeBlackMat);
        eL2.position.set(0.2, 0.06, 0.16);
        fishGroup.add(eL1);
        fishGroup.add(eL2);

        // Right eye
        const eR1 = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eR1.position.set(0.18, 0.06, -0.14);
        const eR2 = new THREE.Mesh(eyeBlackGeo, eyeBlackMat);
        eR2.position.set(0.2, 0.06, -0.16);
        fishGroup.add(eR1);
        fishGroup.add(eR2);

        group.add(fishGroup);
        break;
      }
      case 'cars': {
        // Detailed miniature cartoon/realistic toy sedan car!
        const carColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981];
        const randomColor = carColors[Math.floor(Math.random() * carColors.length)];

        const carGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: randomColor, 
          roughness: 0.15,
          metalness: 0.15
        });

        // Rounded body/chassis
        const baseGeo = new THREE.BoxGeometry(0.46, 0.13, 0.26);
        const base = new THREE.Mesh(baseGeo, bodyMat);
        base.position.y = 0.08;
        base.castShadow = true;
        carGroup.add(base);

        // Rounded cabin with black windows
        const cabinGeo = new THREE.BoxGeometry(0.26, 0.12, 0.22);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(-0.02, 0.19, 0);
        cabin.castShadow = true;
        carGroup.add(cabin);

        // Black windows on the cabin
        const windowGeo = new THREE.BoxGeometry(0.18, 0.08, 0.23);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.05 });
        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.set(-0.02, 0.19, 0);
        carGroup.add(win);

        // Front bumper / Chrome grill
        const bumperGeo = new THREE.BoxGeometry(0.04, 0.05, 0.2);
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, roughness: 0.1, metalness: 0.9 });
        const bumper = new THREE.Mesh(bumperGeo, chromeMat);
        bumper.position.set(0.24, 0.06, 0);
        carGroup.add(bumper);

        // Glowing yellow headlights
        const lightGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
        lightGeo.rotateZ(Math.PI / 2);
        const lightMat = new THREE.MeshStandardMaterial({ color: 0xfffa65, emissive: 0xfffa65, emissiveIntensity: 0.7 });
        
        const headL = new THREE.Mesh(lightGeo, lightMat);
        headL.position.set(0.24, 0.1, 0.09);
        const headR = headL.clone();
        headR.position.z = -0.09;
        carGroup.add(headL);
        carGroup.add(headR);

        // Red back tail lights
        const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff2e1f, emissive: 0xff2e1f, emissiveIntensity: 0.4 });
        const tailL = new THREE.Mesh(lightGeo, tailLightMat);
        tailL.position.set(-0.24, 0.1, 0.09);
        const tailR = tailL.clone();
        tailR.position.z = -0.09;
        carGroup.add(tailL);
        carGroup.add(tailR);

        // 4 detailed wheels with chrome hubcaps!
        const wheelGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16);
        wheelGeo.rotateX(Math.PI / 2);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.8 });
        
        const hubGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.045, 8);
        hubGeo.rotateX(Math.PI / 2);

        const wheelPositions = [
          [-0.14, 0.03, 0.135],
          [0.14, 0.03, 0.135],
          [-0.14, 0.03, -0.135],
          [0.14, 0.03, -0.135]
        ];

        wheelPositions.forEach(([wx, wy, wz]) => {
          const tire = new THREE.Mesh(wheelGeo, tireMat);
          tire.position.set(wx, wy, wz);
          tire.castShadow = true;
          
          // Add chrome hubcap inside wheel
          const hub = new THREE.Mesh(hubGeo, chromeMat);
          hub.position.set(wx, wy, wz);
          carGroup.add(tire);
          carGroup.add(hub);
        });

        group.add(carGroup);
        break;
      }
      case 'cats': {
        // Cute little orange kitten with ears, whiskers, tail
        const catGroup = new THREE.Group();
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf57215, roughness: 0.5 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffa4b4, roughness: 0.5 });

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12);
        const body = new THREE.Mesh(bodyGeo, orangeMat);
        body.position.y = 0.12;
        body.castShadow = true;
        catGroup.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeo, orangeMat);
        head.position.y = 0.29;
        head.castShadow = true;
        catGroup.add(head);

        // Ears (Cones)
        const earGeo = new THREE.ConeGeometry(0.045, 0.1, 4);
        const earL = new THREE.Mesh(earGeo, orangeMat);
        earL.position.set(-0.08, 0.4, 0.02);
        earL.rotation.z = 0.2;
        const earR = new THREE.Mesh(earGeo, orangeMat);
        earR.position.set(0.08, 0.4, 0.02);
        earR.rotation.z = -0.2;
        catGroup.add(earL);
        catGroup.add(earR);

        // Inner Ears
        const innerEarGeo = new THREE.ConeGeometry(0.025, 0.07, 4);
        const innerEarL = new THREE.Mesh(innerEarGeo, pinkMat);
        innerEarL.position.set(-0.08, 0.39, 0.04);
        innerEarL.rotation.z = 0.2;
        const innerEarR = new THREE.Mesh(innerEarGeo, pinkMat);
        innerEarR.position.set(0.08, 0.39, 0.04);
        innerEarR.rotation.z = -0.2;
        catGroup.add(innerEarL);
        catGroup.add(innerEarR);

        // Snout & Nose
        const snoutGeo = new THREE.SphereGeometry(0.04, 8, 8);
        snoutGeo.scale(1.2, 0.8, 0.8);
        const snout = new THREE.Mesh(snoutGeo, whiteMat);
        snout.position.set(0, 0.26, 0.11);
        catGroup.add(snout);

        const noseGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const nose = new THREE.Mesh(noseGeo, pinkMat);
        nose.position.set(0, 0.27, 0.14);
        catGroup.add(nose);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, blackMat);
        eyeL.position.set(-0.05, 0.31, 0.12);
        const eyeR = new THREE.Mesh(eyeGeo, blackMat);
        eyeR.position.set(0.05, 0.31, 0.12);
        catGroup.add(eyeL);
        catGroup.add(eyeR);

        // Whiskers (thin cylinders)
        const whiskerGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.12, 4);
        whiskerGeo.rotateZ(Math.PI / 2);
        
        const wL1 = new THREE.Mesh(whiskerGeo, whiteMat);
        wL1.position.set(-0.09, 0.25, 0.12);
        wL1.rotation.y = 0.2;
        const wL2 = new THREE.Mesh(whiskerGeo, whiteMat);
        wL2.position.set(-0.09, 0.23, 0.12);
        wL2.rotation.y = 0.2;
        wL2.rotation.z = -0.15;

        const wR1 = new THREE.Mesh(whiskerGeo, whiteMat);
        wR1.position.set(0.09, 0.25, 0.12);
        wR1.rotation.y = -0.2;
        const wR2 = new THREE.Mesh(whiskerGeo, whiteMat);
        wR2.position.set(0.09, 0.23, 0.12);
        wR2.rotation.y = -0.2;
        wR2.rotation.z = 0.15;

        catGroup.add(wL1);
        catGroup.add(wL2);
        catGroup.add(wR1);
        catGroup.add(wR2);

        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6);
        tailGeo.rotateX(Math.PI / 4);
        const tail = new THREE.Mesh(tailGeo, orangeMat);
        tail.position.set(0, 0.08, -0.15);
        catGroup.add(tail);

        group.add(catGroup);
        break;
      }
      case 'dogs': {
        // Cute warm-brown puppy with floppy ears and snout
        const dogGroup = new THREE.Group();
        const brownMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
        const darkBrownMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.24, 12);
        const body = new THREE.Mesh(bodyGeo, brownMat);
        body.position.y = 0.12;
        body.castShadow = true;
        dogGroup.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeo, brownMat);
        head.position.y = 0.29;
        head.castShadow = true;
        dogGroup.add(head);

        // Floppy Ears (elongated boxes)
        const earGeo = new THREE.BoxGeometry(0.04, 0.14, 0.06);
        const earL = new THREE.Mesh(earGeo, darkBrownMat);
        earL.position.set(-0.14, 0.26, 0.02);
        earL.rotation.z = 0.25;
        const earR = new THREE.Mesh(earGeo, darkBrownMat);
        earR.position.set(0.14, 0.26, 0.02);
        earR.rotation.z = -0.25;
        dogGroup.add(earL);
        dogGroup.add(earR);

        // Snout
        const snoutGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
        const snout = new THREE.Mesh(snoutGeo, whiteMat);
        snout.position.set(0, 0.25, 0.12);
        dogGroup.add(snout);

        // Black Nose on Snout
        const noseGeo = new THREE.SphereGeometry(0.022, 8, 8);
        const nose = new THREE.Mesh(noseGeo, blackMat);
        nose.position.set(0, 0.27, 0.16);
        dogGroup.add(nose);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, blackMat);
        eyeL.position.set(-0.05, 0.32, 0.12);
        const eyeR = new THREE.Mesh(eyeGeo, blackMat);
        eyeR.position.set(0.05, 0.32, 0.12);
        dogGroup.add(eyeL);
        dogGroup.add(eyeR);

        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6);
        tailGeo.rotateX(-Math.PI / 4);
        const tail = new THREE.Mesh(tailGeo, brownMat);
        tail.position.set(0, 0.1, -0.15);
        dogGroup.add(tail);

        group.add(dogGroup);
        break;
      }
      case 'pandas': {
        // High-fidelity baby panda (Black & White)
        const pandaGroup = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.4 });

        // Body (White with black limbs)
        const bodyGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const body = new THREE.Mesh(bodyGeo, whiteMat);
        body.position.y = 0.12;
        body.castShadow = true;
        pandaGroup.add(body);

        // Black legs/arms
        const limbGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
        const limbL = new THREE.Mesh(limbGeo, blackMat);
        limbL.position.set(-0.1, 0.05, 0.05);
        const limbR = new THREE.Mesh(limbGeo, blackMat);
        limbR.position.set(0.1, 0.05, 0.05);
        const armL = new THREE.Mesh(limbGeo, blackMat);
        armL.position.set(-0.12, 0.16, 0.05);
        armL.rotation.z = Math.PI / 3;
        const armR = new THREE.Mesh(limbGeo, blackMat);
        armR.position.set(0.12, 0.16, 0.05);
        armR.rotation.z = -Math.PI / 3;

        pandaGroup.add(limbL);
        pandaGroup.add(limbR);
        pandaGroup.add(armL);
        pandaGroup.add(armR);

        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeo, whiteMat);
        head.position.y = 0.28;
        head.castShadow = true;
        pandaGroup.add(head);

        // Ears (Round black spheres)
        const earGeo = new THREE.SphereGeometry(0.045, 12, 12);
        const earL = new THREE.Mesh(earGeo, blackMat);
        earL.position.set(-0.11, 0.39, 0);
        const earR = new THREE.Mesh(earGeo, blackMat);
        earR.position.set(0.11, 0.39, 0);
        pandaGroup.add(earL);
        pandaGroup.add(earR);

        // Black Eye Patches (Flat cylinders)
        const patchGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 12);
        patchGeo.rotateX(Math.PI / 2);
        const patchL = new THREE.Mesh(patchGeo, blackMat);
        patchL.position.set(-0.05, 0.29, 0.13);
        patchL.rotation.z = 0.25;
        const patchR = new THREE.Mesh(patchGeo, blackMat);
        patchR.position.set(0.05, 0.29, 0.13);
        patchR.rotation.z = -0.25;
        pandaGroup.add(patchL);
        pandaGroup.add(patchR);

        // Tiny white eyes inside patches
        const eyeGeo = new THREE.SphereGeometry(0.014, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, whiteMat);
        eyeL.position.set(-0.05, 0.3, 0.14);
        const eyeR = new THREE.Mesh(eyeGeo, whiteMat);
        eyeR.position.set(0.05, 0.3, 0.14);
        pandaGroup.add(eyeL);
        pandaGroup.add(eyeR);

        // Snout & black nose
        const snoutGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const snout = new THREE.Mesh(snoutGeo, whiteMat);
        snout.position.set(0, 0.24, 0.13);
        pandaGroup.add(snout);

        const noseGeo = new THREE.SphereGeometry(0.016, 8, 8);
        const nose = new THREE.Mesh(noseGeo, blackMat);
        nose.position.set(0, 0.25, 0.155);
        pandaGroup.add(nose);

        group.add(pandaGroup);
        break;
      }
      case 'bunnies': {
        // Cute pink and white bunny with huge long ears
        const bunnyGroup = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.5 });
        const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffa4b4, roughness: 0.5 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

        // Body (rounded fluffy sphere)
        const bodyGeo = new THREE.SphereGeometry(0.14, 16, 16);
        bodyGeo.scale(1, 1, 1.1);
        const body = new THREE.Mesh(bodyGeo, whiteMat);
        body.position.y = 0.12;
        body.castShadow = true;
        bunnyGroup.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.13, 16, 16);
        const head = new THREE.Mesh(headGeo, whiteMat);
        head.position.y = 0.27;
        head.castShadow = true;
        bunnyGroup.add(head);

        // Huge Long Ears (scaled capsules/boxes)
        const earGeo = new THREE.BoxGeometry(0.03, 0.18, 0.04);
        const earL = new THREE.Mesh(earGeo, whiteMat);
        earL.position.set(-0.05, 0.4, 0);
        earL.rotation.z = -0.08;
        const earR = new THREE.Mesh(earGeo, whiteMat);
        earR.position.set(0.05, 0.4, 0);
        earR.rotation.z = 0.08;
        bunnyGroup.add(earL);
        bunnyGroup.add(earR);

        // Inner Pink Ears
        const innerEarGeo = new THREE.BoxGeometry(0.016, 0.14, 0.01);
        const innerL = new THREE.Mesh(innerEarGeo, pinkMat);
        innerL.position.set(-0.05, 0.39, 0.02);
        innerL.rotation.z = -0.08;
        const innerR = new THREE.Mesh(innerEarGeo, pinkMat);
        innerR.position.set(0.05, 0.39, 0.02);
        innerR.rotation.z = 0.08;
        bunnyGroup.add(innerL);
        bunnyGroup.add(innerR);

        // Snout
        const snoutGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const snout = new THREE.Mesh(snoutGeo, whiteMat);
        snout.position.set(0, 0.24, 0.11);
        bunnyGroup.add(snout);

        const noseGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const nose = new THREE.Mesh(noseGeo, pinkMat);
        nose.position.set(0, 0.25, 0.13);
        bunnyGroup.add(nose);

        // Large cute shiny eyes
        const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, blackMat);
        eyeL.position.set(-0.05, 0.29, 0.1);
        const eyeR = new THREE.Mesh(eyeGeo, blackMat);
        eyeR.position.set(0.05, 0.29, 0.1);
        bunnyGroup.add(eyeL);
        bunnyGroup.add(eyeR);

        // Fluffy ball tail
        const tailGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const tail = new THREE.Mesh(tailGeo, whiteMat);
        tail.position.set(0, 0.1, -0.14);
        bunnyGroup.add(tail);

        group.add(bunnyGroup);
        break;
      }
      case 'lions': {
        // Cute lion cub with golden body and big brown mane
        const lionGroup = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.5 }); // Golden yellow
        const maneMat = new THREE.MeshStandardMaterial({ color: 0xd84315, roughness: 0.7 }); // Orange-brown
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.22, 12);
        const body = new THREE.Mesh(bodyGeo, goldMat);
        body.position.y = 0.11;
        body.castShadow = true;
        lionGroup.add(body);

        // Big Fluffy Mane (Torus behind the head)
        const maneGeo = new THREE.TorusGeometry(0.12, 0.08, 8, 16);
        const mane = new THREE.Mesh(maneGeo, maneMat);
        mane.position.set(0, 0.28, -0.04);
        mane.castShadow = true;
        lionGroup.add(mane);

        // Head (inside mane)
        const headGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const head = new THREE.Mesh(headGeo, goldMat);
        head.position.y = 0.28;
        head.castShadow = true;
        lionGroup.add(head);

        // Round Ears
        const earGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const earL = new THREE.Mesh(earGeo, goldMat);
        earL.position.set(-0.1, 0.38, 0);
        const earR = new THREE.Mesh(earGeo, goldMat);
        earR.position.set(0.1, 0.38, 0);
        lionGroup.add(earL);
        lionGroup.add(earR);

        // Snout
        const snoutGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const snout = new THREE.Mesh(snoutGeo, whiteMat);
        snout.position.set(0, 0.24, 0.11);
        lionGroup.add(snout);

        const noseGeo = new THREE.SphereGeometry(0.016, 8, 8);
        const nose = new THREE.Mesh(noseGeo, blackMat);
        nose.position.set(0, 0.25, 0.14);
        lionGroup.add(nose);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.024, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, blackMat);
        eyeL.position.set(-0.05, 0.3, 0.11);
        const eyeR = new THREE.Mesh(eyeGeo, blackMat);
        eyeR.position.set(0.05, 0.3, 0.11);
        lionGroup.add(eyeL);
        lionGroup.add(eyeR);

        // Tail with fluffy orange-brown tip
        const tailGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6);
        tailGeo.rotateX(Math.PI / 4);
        const tail = new THREE.Mesh(tailGeo, goldMat);
        tail.position.set(0, 0.08, -0.14);
        lionGroup.add(tail);

        const tipGeo = new THREE.SphereGeometry(0.025, 6, 6);
        const tip = new THREE.Mesh(tipGeo, maneMat);
        tip.position.set(0, 0.03, -0.19);
        lionGroup.add(tip);

        group.add(lionGroup);
        break;
      }
      case 'trees': {
        // Organic deciduous/fruit tree with brown trunk, fluffy green spheres, and tiny red apples!
        const treeGroup = new THREE.Group();

        // Sturdy bark/trunk
        const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.11;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Fluffy overlapping layers of organic foliage
        const foliageGroup = new THREE.Group();
        const fMatDark = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.5 }); // Dark green
        const fMatMid = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });  // Medium green
        const fMatLight = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.5 }); // Bright green

        const sphereGeo = new THREE.SphereGeometry(0.18, 12, 12);

        // Base cluster
        const leaf1 = new THREE.Mesh(sphereGeo, fMatDark);
        leaf1.position.set(0, 0.32, 0);
        foliageGroup.add(leaf1);

        const leaf2 = new THREE.Mesh(sphereGeo, fMatMid);
        leaf2.position.set(-0.11, 0.26, 0.08);
        leaf2.scale.set(0.85, 0.85, 0.85);
        foliageGroup.add(leaf2);

        const leaf3 = new THREE.Mesh(sphereGeo, fMatMid);
        leaf3.position.set(0.11, 0.28, -0.06);
        leaf3.scale.set(0.85, 0.85, 0.85);
        foliageGroup.add(leaf3);

        const leaf4 = new THREE.Mesh(sphereGeo, fMatLight);
        leaf4.position.set(0.02, 0.42, 0.02);
        leaf4.scale.set(0.75, 0.75, 0.75);
        foliageGroup.add(leaf4);

        // Add 4-5 tiny cute red apples hanging from the tree branches!
        const miniAppleGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const miniAppleMat = new THREE.MeshStandardMaterial({ color: 0xf44336, roughness: 0.2 });
        
        const applePositions = [
          [-0.08, 0.22, 0.08],
          [0.08, 0.24, -0.06],
          [-0.02, 0.28, -0.1],
          [0.06, 0.31, 0.1]
        ];

        applePositions.forEach(([ax, ay, az]) => {
          const miniApple = new THREE.Mesh(miniAppleGeo, miniAppleMat);
          miniApple.position.set(ax, ay, az);
          foliageGroup.add(miniApple);
        });

        foliageGroup.traverse(child => {
          if (child instanceof THREE.Mesh) child.castShadow = true;
        });

        treeGroup.add(foliageGroup);
        group.add(treeGroup);
        break;
      }
    }

    return group;
  };

  // Layout items beautifully on their respective sub-islands based on quantity count
  const arrangeObjectsOnIsland = (group: THREE.Group, count: number, type: ObjectType) => {
    // Clear out any previous objects
    const itemsGroup = new THREE.Group();
    group.add(itemsGroup);

    if (count === 1) {
      // Centered
      const obj = createProceduralObject(type);
      obj.position.set(0, 0.35, 0);
      itemsGroup.add(obj);
    } else if (count <= 4) {
      // Grid pattern
      const spacing = 0.35;
      const positions = [
        [-spacing, 0.35, -spacing],
        [spacing, 0.35, -spacing],
        [-spacing, 0.35, spacing],
        [spacing, 0.35, spacing]
      ];
      for (let i = 0; i < count; i++) {
        const obj = createProceduralObject(type);
        obj.position.set(positions[i][0], positions[i][1], positions[i][2]);
        itemsGroup.add(obj);
      }
    } else if (count <= 10) {
      // Circle pattern
      const radius = 0.45;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const obj = createProceduralObject(type);
        obj.position.set(Math.cos(angle) * radius, 0.35, Math.sin(angle) * radius);
        obj.rotation.y = -angle;
        itemsGroup.add(obj);
      }
    } else {
      // Double circle / spiral pattern for larger numbers (11-20)
      for (let i = 0; i < count; i++) {
        const factor = i / count;
        const radius = 0.28 + factor * 0.35; // spiraling outward
        const angle = factor * Math.PI * 4.8; // spiral wraps multiple times
        const obj = createProceduralObject(type);
        
        // Random slight height variation to make balloons feel layered
        const isBalloon = type === 'balloons';
        const heightOffset = isBalloon ? 0.35 + (i % 3) * 0.15 : 0.35;

        obj.position.set(Math.cos(angle) * radius, heightOffset, Math.sin(angle) * radius);
        itemsGroup.add(obj);
      }
    }
  };

  // Sparkly celebration confetti particles
  const triggerConfettiBurst = () => {
    if (!celebrationConfettiRef.current) return;

    // Remove any old confetti
    while (celebrationConfettiRef.current.children.length > 0) {
      celebrationConfettiRef.current.remove(celebrationConfettiRef.current.children[0]);
    }

    const confettiColors = [0xff007f, 0x00f3ff, 0xffea00, 0xff00ff, 0x00ff66, 0xff5500];
    const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.01);

    for (let i = 0; i < 120; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Spawn burst near the main floating island
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        2.5 + (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 4
      );

      // Assign custom physics properties dynamically
      mesh.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 8
        ),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10
        )
      };

      celebrationConfettiRef.current.add(mesh);
    }
  };

  // Initialize the ThreeJS context
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Dreamy Sky Gradient Background (Matches Clean Minimalism pale turquoise/mint theme)
    scene.background = new THREE.Color(0xe0f7fa);
    scene.fog = new THREE.FogExp2(0xe0f7fa, 0.04);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Position camera dynamically to overlook the floating islands
    camera.position.set(0, 4.8, 11);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true // Required for the Screenshot features!
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit to 2 for battery savings on Android
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x93c5fd, 0.45);
    scene.add(hemisphereLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 5. Ambient Particles (twinkling magical stars floating in the air)
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = Math.random() * 8 - 1;
      positions[i + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.08,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Confetti group for success celebration
    const confettiGroup = new THREE.Group();
    scene.add(confettiGroup);
    celebrationConfettiRef.current = confettiGroup;

    // 7. Clouds group floating gently in background
    const clouds = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (let i = 0; i < 5; i++) {
      const cloudGroup = new THREE.Group();
      const numPods = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numPods; j++) {
        const podGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.4, 8, 8);
        const pod = new THREE.Mesh(podGeo, cloudMat);
        pod.position.set((j - numPods / 2) * 0.5, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.3);
        cloudGroup.add(pod);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 12,
        3.5 + Math.random() * 1.5,
        -5 - Math.random() * 4
      );
      cloudGroup.userData = { speed: 0.002 + Math.random() * 0.003 };
      clouds.add(cloudGroup);
    }
    scene.add(clouds);
    cloudsRef.current = clouds;

    // 8. Construct the Main Island in center background
    const mainIsland = new THREE.Group();
    mainIsland.position.set(0, 0.8, -1.8);
    scene.add(mainIsland);
    mainIslandRef.current = mainIsland;

    // Low-poly grassy top (cylinder)
    const topGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.4, 16);
    const topMat = new THREE.MeshToonMaterial({ color: 0x4ade80 }); // Bright grass green
    const topGrass = new THREE.Mesh(topGeo, topMat);
    topGrass.receiveShadow = true;
    mainIsland.add(topGrass);

    // Rocky dirt bottom (cone pointing down)
    const rockGeo = new THREE.ConeGeometry(1.7, 1.8, 16);
    const rockMat = new THREE.MeshToonMaterial({ color: 0xa16207 }); // Earthy brown
    const rockBase = new THREE.Mesh(rockGeo, rockMat);
    rockBase.position.y = -0.9;
    rockBase.rotation.x = Math.PI;
    mainIsland.add(rockBase);

    // Decorative tiny 3D tree on main island
    const decoTree = createProceduralObject('trees');
    decoTree.position.set(-1.1, 0.2, -0.6);
    decoTree.scale.set(1.4, 1.4, 1.4);
    mainIsland.add(decoTree);

    // Decorative colorful flower on main island
    const flowerGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const flowerMat = new THREE.MeshToonMaterial({ color: 0xec4899 });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(1.1, 0.26, 0.6);
    mainIsland.add(flower);

    // 9. Floating glassmorphic target number card
    const cardGeo = new THREE.BoxGeometry(2.4, 2.4, 0.15);
    const numberTexture = createNumberTexture(targetNumber, currentLanguage);
    const cardMat = new THREE.MeshStandardMaterial({
      map: numberTexture,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true
    });
    const numberCard = new THREE.Mesh(cardGeo, cardMat);
    numberCard.position.set(0, 2.3, 0); // Suspended elegantly in air
    numberCard.castShadow = true;
    mainIsland.add(numberCard);
    numberCardRef.current = numberCard;

    // 10. Construct the four interactive Option Islands in foreground
    // Position options horizontally based on modern landscape layout
    const optionIslands: THREE.Group[] = [];
    const islandSpacingX = 2.4; // Spacious layout for preschool touch
    const positionsX = [-1.5 * islandSpacingX, -0.5 * islandSpacingX, 0.5 * islandSpacingX, 1.5 * islandSpacingX];

    options.forEach((optValue, idx) => {
      const subIsland = new THREE.Group();
      // Curved layout: Outer islands are slightly forward & lower, making a nice visual amphitheater arc
      const depthOffset = idx === 0 || idx === 3 ? 1.5 : 1.2;
      const heightY = idx === 0 || idx === 3 ? -1.0 : -0.8;
      
      subIsland.position.set(positionsX[idx], heightY, depthOffset);
      scene.add(subIsland);
      optionIslands.push(subIsland);

      // Low poly grass disk
      const subGrassGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.22, 12);
      const subGrassMat = new THREE.MeshToonMaterial({ color: 0x86efac }); // Slightly lighter green
      const subGrass = new THREE.Mesh(subGrassGeo, subGrassMat);
      subGrass.receiveShadow = true;
      subGrass.castShadow = true;
      subIsland.add(subGrass);

      // Rocky base
      const subRockGeo = new THREE.ConeGeometry(0.95, 1.0, 12);
      const subRockBase = new THREE.Mesh(subRockGeo, rockMat);
      subRockBase.position.y = -0.5;
      subRockBase.rotation.x = Math.PI;
      subIsland.add(subRockBase);

      // Add custom target data so the Raycaster knows what option value this is!
      subIsland.userData = { count: optValue, originalY: heightY, index: idx };

      // Spawn procedural counting items on this sub-island
      arrangeObjectsOnIsland(subIsland, optValue, objectType);
    });
    optionIslandsRef.current = optionIslands;

    // 11. Core Animation Tick Loop
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Float main island gently
      if (mainIslandRef.current) {
        mainIslandRef.current.position.y = 0.8 + Math.sin(time * 0.0012) * 0.12;
        mainIslandRef.current.rotation.y = Math.sin(time * 0.0004) * 0.06;
      }

      // Large number breathing/glowing effect
      if (numberCardRef.current) {
        const breatheScale = 1.0 + Math.sin(time * 0.0022) * 0.04;
        numberCardRef.current.scale.set(breatheScale, breatheScale, breatheScale);
        // Soft hover tilt
        numberCardRef.current.rotation.y = Math.sin(time * 0.001) * 0.15;
      }

      // Gently rotate ambient particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0008;
      }

      // Drift clouds slowly
      if (cloudsRef.current) {
        cloudsRef.current.children.forEach((cloud) => {
          cloud.position.x += cloud.userData.speed;
          if (cloud.position.x > 8) {
            cloud.position.x = -8;
          }
        });
      }

      // Animate four option islands (gentle bobbing & rotating)
      optionIslandsRef.current.forEach((island, i) => {
        // Only bob if NOT currently performing a shake animation
        if (shakeIslandIndex.current !== i) {
          const bobSpeed = 0.0015 + i * 0.0002;
          island.position.y = island.userData.originalY + Math.sin(time * bobSpeed) * 0.06;
          island.rotation.y = Math.sin(time * 0.0008 + i) * 0.05;
        } else {
          // Perform a friendly lateral "Wobble/Shake" for wrong answer selection
          const elapsedShake = time - shakeTime.current;
          if (elapsedShake < 600) {
            const wobble = Math.sin(elapsedShake * 0.04) * 0.18;
            island.position.x = positionsX[i] + wobble;
          } else {
            // End shake
            island.position.x = positionsX[i];
            shakeIslandIndex.current = null;
          }
        }

        // Animate the tiny procedural child objects on the islands (float/spin)
        // Check if there is a group of objects
        if (island.children[2]) {
          island.children[2].children.forEach((obj, objIdx) => {
            const spinFactor = 0.002 + objIdx * 0.0003;
            obj.rotation.y = time * spinFactor;
            
            // If balloons, make them sway like wind is blowing
            if (objectType === 'balloons') {
              obj.rotation.z = Math.sin(time * 0.0015 + objIdx) * 0.12;
            } else {
              // Gentle hop/bounce
              obj.position.y = (objectType === 'balloons' ? obj.position.y : 0.35) + Math.sin(time * 0.003 + objIdx) * 0.03;
            }
          });
        }
      });

      // Animate success burst confetti
      if (celebrationConfettiRef.current) {
        celebrationConfettiRef.current.children.forEach((confettiMesh: THREE.Object3D) => {
          const mesh = confettiMesh as THREE.Mesh;
          const vel = mesh.userData.velocity as THREE.Vector3;
          const rotSpeed = mesh.userData.rotationSpeed as THREE.Vector3;

          // Apply gravity
          vel.y -= 0.15;
          // Apply air friction
          vel.multiplyScalar(0.985);

          // Update position
          mesh.position.addScaledVector(vel, 0.016);

          // Update rotation
          mesh.rotation.x += rotSpeed.x * 0.016;
          mesh.rotation.y += rotSpeed.y * 0.016;
          mesh.rotation.z += rotSpeed.z * 0.016;
        });
      }

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Begin Animation cycle
    animate(0);

    // Responsive window resizing with ResizeObserver to prevent layout stretching
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: w, height: h } = entries[0].contentRect;

      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = w / h;
        // Dynamically shift camera distance on ultra-narrow portrait phone screens
        if (w < h) {
          cameraRef.current.position.set(0, 5.2, 14); // Zoom out so everything fits portrait layout
        } else {
          cameraRef.current.position.set(0, 4.8, 11); // Standard desktop/tablet distance
        }
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    });

    resizeObserver.observe(containerRef.current);

    // 12. Unmount Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Extensive GPU and CPU memory disposal
      scene.clear();
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      topGeo.dispose();
      topMat.dispose();
      rockGeo.dispose();
      rockMat.dispose();
      cardGeo.dispose();
      cardMat.dispose();
      numberTexture.dispose();
    };
  }, [targetNumber, options, objectType]); // Rebuild when levels or options changes

  // Click & Touch raycasting to detect child interaction on option islands
  const handleInteraction = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // Collect all recursive meshes from the option islands to detect hits
    const hitTargets: THREE.Object3D[] = [];
    optionIslandsRef.current.forEach(group => {
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          hitTargets.push(child);
        }
      });
    });

    const intersects = raycaster.current.intersectObjects(hitTargets, true);

    if (intersects.length > 0) {
      // Find the top-level sub-island group
      let hitMesh = intersects[0].object;
      let parentIsland: THREE.Object3D | null = hitMesh;
      
      while (parentIsland && !optionIslandsRef.current.includes(parentIsland as THREE.Group)) {
        parentIsland = parentIsland.parent;
      }

      if (parentIsland) {
        const selectedValue = parentIsland.userData.count;
        const selectedIdx = parentIsland.userData.index;

        // Visual bounce animation feedback on the selected island
        const originalY = parentIsland.userData.originalY;
        
        if (selectedValue === targetNumber) {
          // Correct Answer animation: Super Bounce!
          let bounceTime = 0;
          const bounceInterval = setInterval(() => {
            bounceTime += 0.05;
            if (parentIsland) {
              parentIsland.position.y = originalY + Math.sin(bounceTime * Math.PI) * 1.1;
              parentIsland.scale.set(1.15, 1.15, 1.15);
            }
            if (bounceTime >= 1.0) {
              clearInterval(bounceInterval);
              if (parentIsland) {
                parentIsland.scale.set(1, 1, 1);
              }
            }
          }, 16);

          triggerConfettiBurst();
        } else {
          // Wrong Answer feedback: Trigger shake/wobble
          shakeIslandIndex.current = selectedIdx;
          shakeTime.current = performance.now();
        }

        onSelectOption(selectedValue);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    handleInteraction(e.clientX, e.clientY);
  };

  // Track cursor hover movement on desktop to dynamically update cursor style
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || !cameraRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    const hitTargets: THREE.Object3D[] = [];
    optionIslandsRef.current.forEach(group => {
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          hitTargets.push(child);
        }
      });
    });

    const intersects = raycaster.current.intersectObjects(hitTargets, true);
    if (intersects.length > 0) {
      canvasRef.current.style.cursor = 'pointer';
    } else {
      canvasRef.current.style.cursor = 'default';
    }
  };

  return (
    <div 
      id="3d-game-stage"
      ref={containerRef} 
      className="relative w-full h-full min-h-[480px] lg:min-h-[580px] overflow-hidden rounded-3xl bg-blue-50/50 shadow-inner"
    >
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full block touch-none"
      />
      {/* Soft overlay vignette to guide child attention towards the interactive core */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_40%,rgba(147,197,253,0.15)_100%)] rounded-3xl" />
    </div>
  );
};
