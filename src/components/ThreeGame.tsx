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

    // Force the object type to be 'apples' as requested by the user
    const activeType = 'apples' as any;

    switch (activeType) {
      case 'apples': {
        // High-gloss realistic red apple
        const bodyGeo = new THREE.SphereGeometry(0.24, 24, 24);
        bodyGeo.scale(1, 0.95, 1);
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: 0xef4444, 
          roughness: 0.1, 
          metalness: 0.05
        });
        const appleMesh = new THREE.Mesh(bodyGeo, bodyMat);
        appleMesh.castShadow = true;
        group.add(appleMesh);

        // Apple bottom calyx
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

        // Green leaf
        const leafGeo = new THREE.SphereGeometry(0.06, 12, 12);
        leafGeo.scale(1.5, 0.5, 0.2);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.08, 0.26, 0);
        leaf.rotation.set(0.2, 0, -0.6);
        group.add(leaf);
        break;
      }
      case 'stars': {
        // Bright glossy Orange fruit (replaces star)
        const bodyGeo = new THREE.SphereGeometry(0.24, 24, 24);
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: 0xff7a00, 
          roughness: 0.25, 
          metalness: 0.05
        });
        const orangeMesh = new THREE.Mesh(bodyGeo, bodyMat);
        orangeMesh.castShadow = true;
        group.add(orangeMesh);

        // Tiny green leaf and stem on top
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.1, 8);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.25;
        stem.rotation.z = -0.15;
        group.add(stem);

        const leafGeo = new THREE.SphereGeometry(0.055, 12, 12);
        leafGeo.scale(1.4, 0.5, 0.18);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(-0.06, 0.26, 0.02);
        leaf.rotation.set(0.1, 0, 0.5);
        group.add(leaf);
        break;
      }
      case 'balloons': {
        // Red Strawberry cone/droplet shape (replaces balloons)
        const strawbGroup = new THREE.Group();
        const bodyGeo = new THREE.ConeGeometry(0.22, 0.44, 20);
        bodyGeo.rotateX(Math.PI); 
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: 0xef233c, 
          roughness: 0.15,
          metalness: 0.1
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.05;
        bodyMesh.castShadow = true;
        strawbGroup.add(bodyMesh);

        // Green leaves crown on top
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.5 });
        for (let i = 0; i < 5; i++) {
          const leafAngle = (i * Math.PI * 2) / 5;
          const crownLeafGeo = new THREE.ConeGeometry(0.05, 0.12, 5);
          crownLeafGeo.rotateX(Math.PI / 2.5);
          const crownLeaf = new THREE.Mesh(crownLeafGeo, crownMat);
          crownLeaf.position.set(Math.sin(leafAngle) * 0.08, 0.25, Math.cos(leafAngle) * 0.08);
          crownLeaf.rotation.y = -leafAngle;
          strawbGroup.add(crownLeaf);
        }

        // Tiny stem on top
        const stemGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.08, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.28;
        strawbGroup.add(stem);

        // Tiny yellow seeds scattered on strawberry body
        const seedGeo = new THREE.SphereGeometry(0.012, 4, 4);
        seedGeo.scale(1, 1.8, 0.7);
        const seedMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
        
        const seedPositions = [
          [0.12, 0.1, 0.08], [-0.12, 0.1, -0.08], [0.08, 0.1, -0.12], [-0.08, 0.1, 0.12],
          [0.14, -0.05, 0.02], [-0.14, -0.05, -0.02], [0.02, -0.05, 0.14], [-0.02, -0.05, -0.14],
          [0.08, -0.12, 0.06], [-0.08, -0.12, -0.06], [0.06, -0.12, -0.08], [-0.06, -0.12, 0.08]
        ];
        seedPositions.forEach(([sx, sy, sz]) => {
          const seed = new THREE.Mesh(seedGeo, seedMat);
          seed.position.set(sx, sy, sz);
          strawbGroup.add(seed);
        });

        group.add(strawbGroup);
        break;
      }
      case 'blocks': {
        // Beautiful crescent yellow banana composed of small connected, rotated segments (replaces blocks)
        const bananaGroup = new THREE.Group();
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, roughness: 0.3 });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

        const numSegments = 5;
        for (let i = 0; i < numSegments; i++) {
          const t = i / (numSegments - 1);
          const angle = (t - 0.5) * Math.PI * 0.4; 
          
          const segGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
          const factor = 1.0 - Math.abs(t - 0.5) * 0.5;
          segGeo.scale(factor, 1.1, factor);

          const segMat = (i === 0 || i === numSegments - 1) ? tipMat : yellowMat;
          const segment = new THREE.Mesh(segGeo, segMat);

          const radius = 0.38;
          segment.position.set(
            Math.sin(angle) * radius,
            (t - 0.5) * 0.32,
            Math.cos(angle) * radius - radius
          );
          segment.rotation.z = -angle;
          segment.castShadow = true;
          bananaGroup.add(segment);
        }
        
        bananaGroup.scale.set(1.1, 1.1, 1.1);
        group.add(bananaGroup);
        break;
      }
      case 'fish': {
        // Red triangular slice of watermelon with a green rind and seeds (replaces fish)
        const wmGroup = new THREE.Group();
        const pulpMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.3 });
        const rindMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.5 });
        const whiteRindMat = new THREE.MeshStandardMaterial({ color: 0xf4f9f4, roughness: 0.4 });
        const seedMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

        // Red Pulp: triangular box
        const pulpGeo = new THREE.BoxGeometry(0.38, 0.24, 0.08);
        const pulp = new THREE.Mesh(pulpGeo, pulpMat);
        pulp.castShadow = true;
        wmGroup.add(pulp);

        // White Rind stripe at the bottom
        const whiteRindGeo = new THREE.BoxGeometry(0.42, 0.03, 0.09);
        const whiteRind = new THREE.Mesh(whiteRindGeo, whiteRindMat);
        whiteRind.position.y = -0.135;
        wmGroup.add(whiteRind);

        // Green Rind at the very bottom
        const rindGeo = new THREE.BoxGeometry(0.44, 0.05, 0.1);
        const rind = new THREE.Mesh(rindGeo, rindMat);
        rind.position.y = -0.17;
        wmGroup.add(rind);

        // 4 cute black seeds on the sides of the watermelon slice
        const seedGeo = new THREE.SphereGeometry(0.012, 6, 6);
        seedGeo.scale(1.5, 2.2, 0.8);

        const s1 = new THREE.Mesh(seedGeo, seedMat);
        s1.position.set(-0.08, -0.02, 0.045);
        s1.rotation.z = -0.3;
        
        const s2 = new THREE.Mesh(seedGeo, seedMat);
        s2.position.set(0.08, -0.02, 0.045);
        s2.rotation.z = 0.3;

        const s3 = new THREE.Mesh(seedGeo, seedMat);
        s3.position.set(-0.08, -0.02, -0.045);
        s3.rotation.z = -0.3;
        
        const s4 = new THREE.Mesh(seedGeo, seedMat);
        s4.position.set(0.08, -0.02, -0.045);
        s4.rotation.z = 0.3;

        wmGroup.add(s1);
        wmGroup.add(s2);
        wmGroup.add(s3);
        wmGroup.add(s4);

        group.add(wmGroup);
        break;
      }
      case 'cars': {
        // High-gloss elegant light green-yellow pear (replaces cars)
        const bodyGroup = new THREE.Group();
        
        // Lower big bulb
        const lowerGeo = new THREE.SphereGeometry(0.2, 20, 20);
        const pearMat = new THREE.MeshStandardMaterial({ 
          color: 0xafdb2a, 
          roughness: 0.15,
          metalness: 0.02
        });
        const lowerMesh = new THREE.Mesh(lowerGeo, pearMat);
        lowerMesh.castShadow = true;
        bodyGroup.add(lowerMesh);

        // Upper smaller bulb
        const upperGeo = new THREE.SphereGeometry(0.12, 16, 16);
        upperGeo.scale(1, 1.4, 1);
        const upperMesh = new THREE.Mesh(upperGeo, pearMat);
        upperMesh.position.y = 0.18;
        upperMesh.castShadow = true;
        bodyGroup.add(upperMesh);

        // Brown wooden stem
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.14, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(0.02, 0.32, 0);
        stem.rotation.z = 0.35;
        bodyGroup.add(stem);

        // Tiny green leaf
        const leafGeo = new THREE.SphereGeometry(0.05, 10, 10);
        leafGeo.scale(1.4, 0.4, 0.18);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.08, 0.31, 0.02);
        leaf.rotation.set(0.1, 0, -0.5);
        bodyGroup.add(leaf);

        group.add(bodyGroup);
        break;
      }
      case 'trees': {
        // A cluster of dark-purple glossy grapes with green stem (replaces trees)
        const grapeGroup = new THREE.Group();
        const purpleMat = new THREE.MeshStandardMaterial({ 
          color: 0x5c1d7e, 
          roughness: 0.12,
          metalness: 0.15
        });
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16 });

        // Arrange 8 spheres in a cluster pointing downwards
        const grapeGeo = new THREE.SphereGeometry(0.09, 12, 12);
        const positions = [
          [0, -0.16, 0], 
          [-0.07, -0.07, 0.04], [0.07, -0.07, -0.04], [0, -0.07, 0.08], 
          [-0.09, 0.03, 0.0], [0.09, 0.03, 0.0], [0, 0.03, -0.08], [0, 0.03, 0.08] 
        ];

        positions.forEach(([gx, gy, gz]) => {
          const grape = new THREE.Mesh(grapeGeo, purpleMat);
          grape.position.set(gx, gy, gz);
          grape.castShadow = true;
          grapeGroup.add(grape);
        });

        // Top stem
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.12;
        stem.rotation.z = 0.2;
        grapeGroup.add(stem);

        // Grape Green Leaf
        const leafGeo = new THREE.SphereGeometry(0.07, 10, 10);
        leafGeo.scale(1.3, 0.3, 1.3);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(-0.06, 0.1, -0.02);
        leaf.rotation.set(0.1, 0, 0.6);
        grapeGroup.add(leaf);

        group.add(grapeGroup);
        break;
      }
      case 'cats': {
        // Bright yellow lemon with dimpled tips and a green leaf (replaces cats)
        const lemonGroup = new THREE.Group();
        const lemonMat = new THREE.MeshStandardMaterial({ 
          color: 0xffd54f, 
          roughness: 0.28,
          metalness: 0.02
        });

        // Egg/oval shaped body
        const bodyGeo = new THREE.SphereGeometry(0.22, 20, 20);
        bodyGeo.scale(1.4, 0.95, 0.95);
        const body = new THREE.Mesh(bodyGeo, lemonMat);
        body.castShadow = true;
        lemonGroup.add(body);

        // Pointy ends
        const tipGeo = new THREE.ConeGeometry(0.05, 0.08, 8);
        tipGeo.rotateZ(Math.PI / 2);
        
        const leftTip = new THREE.Mesh(tipGeo, lemonMat);
        leftTip.position.x = -0.31;
        
        const rightTip = new THREE.Mesh(tipGeo, lemonMat);
        rightTip.position.x = 0.31;
        rightTip.rotation.y = Math.PI;

        lemonGroup.add(leftTip);
        lemonGroup.add(rightTip);

        // Tiny green stem and leaf on top
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.08, 6);
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20 });
        const stem = new THREE.Mesh(stemGeo, greenMat);
        stem.position.y = 0.23;
        stem.rotation.z = -0.15;
        lemonGroup.add(stem);

        const leafGeo = new THREE.SphereGeometry(0.05, 10, 10);
        leafGeo.scale(1.4, 0.4, 0.18);
        const leaf = new THREE.Mesh(leafGeo, greenMat);
        leaf.position.set(-0.06, 0.24, 0.02);
        leaf.rotation.set(0.1, 0, 0.5);
        lemonGroup.add(leaf);

        group.add(lemonGroup);
        break;
      }
      case 'dogs': {
        // Twin hanging shiny red cherries (replaces dogs)
        const cherryGroup = new THREE.Group();
        const redMat = new THREE.MeshStandardMaterial({ 
          color: 0xd90429, 
          roughness: 0.08, 
          metalness: 0.15
        });
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });

        // Left Cherry
        const cLGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const cherryL = new THREE.Mesh(cLGeo, redMat);
        cherryL.position.set(-0.15, -0.12, 0);
        cherryL.castShadow = true;
        cherryGroup.add(cherryL);

        // Right Cherry
        const cherryR = new THREE.Mesh(cLGeo, redMat);
        cherryR.position.set(0.15, -0.12, 0);
        cherryR.castShadow = true;
        cherryGroup.add(cherryR);

        // Angled stems
        const stemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.26, 6);
        
        const stemL = new THREE.Mesh(stemGeo, greenMat);
        stemL.position.set(-0.07, 0.0, 0);
        stemL.rotation.z = -0.5;
        cherryGroup.add(stemL);

        const stemR = new THREE.Mesh(stemGeo, greenMat);
        stemR.position.set(0.07, 0.0, 0);
        stemR.rotation.z = 0.5;
        cherryGroup.add(stemR);

        // Green Leaf at the joint
        const leafGeo = new THREE.SphereGeometry(0.05, 10, 10);
        leafGeo.scale(1.5, 0.4, 0.2);
        const leaf = new THREE.Mesh(leafGeo, greenMat);
        leaf.position.set(0.04, 0.12, 0.02);
        leaf.rotation.set(0.1, 0.1, 0.4);
        cherryGroup.add(leaf);

        group.add(cherryGroup);
        break;
      }
      case 'pandas': {
        // Soft peach with realistic heart indentation/seam and green leaf (replaces pandas)
        const peachGroup = new THREE.Group();
        const peachMat = new THREE.MeshStandardMaterial({ 
          color: 0xff8a65, 
          roughness: 0.45,
          metalness: 0.01
        });

        const lobLGeo = new THREE.SphereGeometry(0.18, 16, 16);
        lobLGeo.scale(1, 1, 0.9);
        const lobeL = new THREE.Mesh(lobLGeo, peachMat);
        lobeL.position.x = -0.035;
        lobeL.castShadow = true;
        peachGroup.add(lobeL);

        const lobeR = new THREE.Mesh(lobLGeo, peachMat);
        lobeR.position.x = 0.035;
        lobeR.castShadow = true;
        peachGroup.add(lobeR);

        // Brown Stem on top
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.08, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.19;
        stem.rotation.z = 0.2;
        peachGroup.add(stem);

        // Leaf
        const leafGeo = new THREE.SphereGeometry(0.055, 10, 10);
        leafGeo.scale(1.4, 0.4, 0.18);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.06, 0.19, -0.02);
        leaf.rotation.set(0.2, 0, -0.4);
        peachGroup.add(leaf);

        group.add(peachGroup);
        break;
      }
      case 'bunnies': {
        // Colorful kid-friendly stylized Pineapple (replaces bunnies)
        const paGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ 
          color: 0xffb74d, 
          roughness: 0.35,
          metalness: 0.05
        });

        // Main cylindrical pinecone body
        const bodyGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.36, 12);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        paGroup.add(body);

        // Add 3 decorative rings around body to create a textured pineapple look
        const ringGeo = new THREE.TorusGeometry(0.17, 0.018, 8, 16);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xf57c00 });
        
        for (let j = 0; j < 3; j++) {
          const r = new THREE.Mesh(ringGeo, ringMat);
          r.position.y = -0.12 + j * 0.12;
          paGroup.add(r);
        }

        // Green spiky crown leaves on top
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 });
        const leafCount = 6;
        for (let i = 0; i < leafCount; i++) {
          const angle = (i * Math.PI * 2) / leafCount;
          const leafConeGeo = new THREE.ConeGeometry(0.045, 0.22, 4);
          leafConeGeo.rotateX(Math.PI / 6); 
          const leafCone = new THREE.Mesh(leafConeGeo, crownMat);
          
          leafCone.position.set(Math.sin(angle) * 0.06, 0.26, Math.cos(angle) * 0.06);
          leafCone.rotation.y = -angle;
          paGroup.add(leafCone);
        }

        group.add(paGroup);
        break;
      }
      case 'lions': {
        // Deep purple plum (replaces lions)
        const plumGroup = new THREE.Group();
        const plumMat = new THREE.MeshStandardMaterial({ 
          color: 0x4a148c, 
          roughness: 0.15,
          metalness: 0.1
        });

        // Main body
        const bodyGeo = new THREE.SphereGeometry(0.22, 20, 20);
        bodyGeo.scale(1.05, 1.0, 1.0);
        const body = new THREE.Mesh(bodyGeo, plumMat);
        body.castShadow = true;
        plumGroup.add(body);

        // Tiny Stem
        const stemGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.1, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.23;
        stem.rotation.z = -0.2;
        plumGroup.add(stem);

        // Green leaf
        const leafGeo = new THREE.SphereGeometry(0.05, 10, 10);
        leafGeo.scale(1.4, 0.4, 0.18);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.3 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(-0.06, 0.22, 0.02);
        leaf.rotation.set(0.1, 0, 0.5);
        plumGroup.add(leaf);

        group.add(plumGroup);
        break;
      }
    }

    return group;
  };

  // Layout items beautifully on top of each option island in a clean, highly-organized concentric 2D grid/concentric ring pattern on the grass surface
  const arrangeObjectsOnIsland = (group: THREE.Group, count: number, type: ObjectType) => {
    // Clear out any previous objects
    const itemsGroup = new THREE.Group();
    itemsGroup.name = "itemsGroup"; // Explicitly name it to reference securely in the animation loop
    itemsGroup.position.y = 0.15; // Elevate so objects sit perfectly on top of the 0.3-height option island top
    group.add(itemsGroup);

    // Dynamic rotation helper to make sure everything faces the camera/child perfectly
    const applyFacingRotation = (obj: THREE.Object3D) => {
      if (type === 'fish' || type === 'cars') {
        obj.rotation.y = -Math.PI / 2; // Rotate 90 degrees so they face forward
      } else {
        obj.rotation.y = 0; // Already facing forward (Z axis)
      }
    };

    // Calculate dynamic scale so items are big, beautiful, and fit on the island
    let itemScale = 0.95;
    if (count > 15) itemScale = 0.62;
    else if (count > 10) itemScale = 0.68;
    else if (count > 5) itemScale = 0.78;
    else if (count > 3) itemScale = 0.86;

    // Generate coordinates on a circle of radius 0.95 (since island radius is 1.3, this leaves 0.35 margin!)
    const getIslandPositions = (c: number, maxRadius: number = 0.95): {x: number, z: number}[] => {
      const positions: {x: number, z: number}[] = [];
      
      if (c === 1) {
        return [{ x: 0, z: 0 }];
      }
      
      if (c === 2) {
        return [{ x: -0.45, z: 0 }, { x: 0.45, z: 0 }];
      }
      
      if (c === 3) {
        return [
          { x: 0, z: -0.4 },
          { x: -0.45, z: 0.3 },
          { x: 0.45, z: 0.3 }
        ];
      }
      
      if (c === 4) {
        return [
          { x: -0.45, z: -0.45 },
          { x: 0.45, z: -0.45 },
          { x: -0.45, z: 0.45 },
          { x: 0.45, z: 0.45 }
        ];
      }
      
      if (c === 5) {
        return [
          { x: 0, z: 0 },
          { x: -0.5, z: -0.5 },
          { x: 0.5, z: -0.5 },
          { x: -0.5, z: 0.5 },
          { x: 0.5, z: 0.5 }
        ];
      }

      // For counts 6 to 20, distribute them in perfectly centered concentric rings for gorgeous symmetry
      let innerCount = 0;
      let outerCount = c;
      
      if (c <= 8) {
        innerCount = 1;
        outerCount = c - 1;
      } else if (c <= 12) {
        innerCount = 3;
        outerCount = c - 3;
      } else if (c <= 16) {
        innerCount = 5;
        outerCount = c - 5;
      } else {
        innerCount = 6;
        outerCount = c - 6;
      }

      // Inner ring
      if (innerCount === 1) {
        positions.push({ x: 0, z: 0 });
      } else if (innerCount > 1) {
        const innerRadius = maxRadius * 0.4;
        for (let i = 0; i < innerCount; i++) {
          const angle = (i * Math.PI * 2) / innerCount;
          positions.push({
            x: Math.cos(angle) * innerRadius,
            z: Math.sin(angle) * innerRadius
          });
        }
      }

      // Outer ring
      const outerRadius = maxRadius * 0.82;
      for (let i = 0; i < outerCount; i++) {
        const angle = (i * Math.PI * 2) / outerCount;
        positions.push({
          x: Math.cos(angle) * outerRadius,
          z: Math.sin(angle) * outerRadius
        });
      }

      return positions;
    };

    const positions = getIslandPositions(count);

    positions.forEach((pos, idx) => {
      const obj = createProceduralObject(type);
      obj.scale.set(itemScale, itemScale, itemScale);

      // Slightly lift the object on Y so its bottom sits on the grass, rather than intersecting
      const baseY = itemScale * 0.22;
      
      obj.position.set(pos.x, baseY, pos.z);
      obj.userData.baseY = baseY; // Save the base Y height for bounce animations!
      applyFacingRotation(obj);

      // Give a tiny, natural rotation twist to non-cars/non-fish to make them look hand-crafted and playful
      if (type !== 'fish' && type !== 'cars') {
        obj.rotation.y = (idx * 0.45) % (Math.PI * 2);
      }

      itemsGroup.add(obj);
    });

    // Ensure all procedural meshes inside the group cast/receive shadows beautifully
    itemsGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
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
    // Position camera dynamically at a high angle to overlook the floating islands with clear depth separation
    camera.position.set(0, 7.5, 10.5);
    camera.lookAt(0, 0.4, 0.5);
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
     // Position options horizontally with spacious layout to prevent overlapping
     const optionIslands: THREE.Group[] = [];
     const islandSpacingX = 2.65; // Balanced spacing so islands are fully centered, distinct, and within clickable bounds
     const positionsX = [-1.5 * islandSpacingX, -0.5 * islandSpacingX, 0.5 * islandSpacingX, 1.5 * islandSpacingX];
 
     // Distinct, high-contrast pastel colors for each option island to make them extremely recognizable for kids
     const islandColors = [0xff5e5e, 0x3498db, 0xf1c40f, 0x9b59b6]; // Red, Blue, Yellow, Purple
 
     options.forEach((optValue, idx) => {
       const subIsland = new THREE.Group();
       // Curved layout: Outer islands are slightly forward & lower, making a nice visual amphitheater arc
       const depthOffset = idx === 0 || idx === 3 ? 1.4 : 1.1;
       const heightY = idx === 0 || idx === 3 ? -0.3 : -0.1;
       
       subIsland.position.set(positionsX[idx], heightY, depthOffset);
       scene.add(subIsland);
       optionIslands.push(subIsland);

        // Beautiful 3D Floating Island mesh for each option
        // Top grassy/flat surface with the unique option color
        const islandTopGeo = new THREE.CylinderGeometry(1.3, 1.45, 0.3, 12);
        const islandTopMat = new THREE.MeshToonMaterial({ 
          color: islandColors[idx]
        });
        const islandTop = new THREE.Mesh(islandTopGeo, islandTopMat);
        islandTop.receiveShadow = true;
        subIsland.add(islandTop);

        // Rocky dirt bottom pointing downwards
        const islandRockGeo = new THREE.ConeGeometry(1.4, 1.2, 12);
        const islandRockMat = new THREE.MeshToonMaterial({ color: 0x8d6e63 }); // earthy brown
        const islandRock = new THREE.Mesh(islandRockGeo, islandRockMat);
        islandRock.position.y = -0.65;
        islandRock.rotation.x = Math.PI;
        islandRock.castShadow = true;
        subIsland.add(islandRock);

        // Generous transparent hit box cylinder for flawless, instant click/touch registration
        const hitBoxGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.0, 8);
        const hitBoxMat = new THREE.MeshBasicMaterial({ 
          transparent: true, 
          opacity: 0, 
          depthWrite: false 
        });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.name = "hitBox";
        hitBox.position.y = 0.5; // Centers around the grassy top and fruits
        subIsland.add(hitBox);
 

 

 

 

 


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

        // Keep objects completely static and fixed as requested by the user
        const itemsGroup = island.getObjectByName("itemsGroup");
        if (itemsGroup) {
          itemsGroup.children.forEach((obj) => {
            if (obj.userData.baseY !== undefined) {
              obj.position.y = obj.userData.baseY;
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
          cameraRef.current.position.set(0, 8.5, 12.5); // Steep high angle for portrait layout
        } else {
          cameraRef.current.position.set(0, 7.5, 10.5); // Steep high angle for landscape/desktop distance
        }
        cameraRef.current.lookAt(0, 0.4, 0.5);
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
