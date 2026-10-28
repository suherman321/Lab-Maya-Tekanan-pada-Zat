/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraPreset, PenetrationStatus, WoodSpecimen } from '../types/physics.ts';
import { createContactShadowTexture, createTableTexture, createWoodTexture } from '../utils/proceduralTextures.ts';
import { soundManager } from '../utils/soundEffects.ts';

interface ThreeSimulationProps {
  forceN: number;
  areaCm2: number;
  wood: WoodSpecimen;
  status: PenetrationStatus;
  soundEnabled: boolean;
  cameraPreset: CameraPreset;
  isActive?: boolean;
  onAnimationComplete: (result: 'penetrated' | 'stopped_surface' | 'idle') => void;
}

// Coordinate constants
const WOOD_SURFACE_Y = 0.5; // Top of the wood plank
const NAIL_HOVER_Y = 2.4;   // Starting position of nail tip above wood
const NAIL_LENGTH = 2.0;    // Total height of the nail model

export const ThreeSimulation: React.FC<ThreeSimulationProps> = ({
  forceN,
  areaCm2,
  wood,
  status,
  soundEnabled,
  cameraPreset,
  isActive = true,
  onAnimationComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  // Mutable refs for animation loop
  const stateRef = useRef({
    forceN,
    areaCm2,
    wood,
    status,
    soundEnabled,
    cameraPreset,
    isActive,
    onAnimationComplete,
    nailY: NAIL_HOVER_Y,
    targetNailY: NAIL_HOVER_Y,
    penetrationDepth: 0,
    impactTriggered: false,
    cameraTargetPos: new THREE.Vector3(3.6, 2.8, 3.8),
    cameraTargetLookAt: new THREE.Vector3(0, 0.7, 0),
  });

  // Keep stateRef in sync with props
  useEffect(() => {
    stateRef.current.forceN = forceN;
    stateRef.current.areaCm2 = areaCm2;
    stateRef.current.wood = wood;
    stateRef.current.soundEnabled = soundEnabled;
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.isActive = isActive;
    stateRef.current.onAnimationComplete = onAnimationComplete;
  }, [forceN, areaCm2, wood, soundEnabled, cameraPreset, isActive, onAnimationComplete]);

  // Resume animation loop when tab becomes active again
  useEffect(() => {
    if (isActive && resumeLoopRef.current) {
      resumeLoopRef.current();
    }
  }, [isActive]);

  // Handle status changes (pressing, resetting)
  useEffect(() => {
    stateRef.current.status = status;

    if (status === 'pressing') {
      stateRef.current.impactTriggered = false;
      if (soundEnabled) {
        soundManager.playWhoosh();
      }

      // Calculate Pressure: P = F / (A * 1e-4) Pa
      const areaM2 = areaCm2 * 1e-4;
      const pressurePa = forceN / areaM2;
      const pressureKPa = pressurePa / 1000;
      const thresholdKPa = wood.thresholdKPa;

      if (pressureKPa >= thresholdKPa && forceN > 0) {
        // Calculate penetration depth proportional to pressure (max ~1.1 units)
        const ratio = Math.min(pressureKPa / thresholdKPa, 4.0);
        const depth = 0.35 + (ratio - 1) * 0.25;
        stateRef.current.penetrationDepth = Math.min(depth, 1.15);
        stateRef.current.targetNailY = WOOD_SURFACE_Y - stateRef.current.penetrationDepth;
      } else {
        // Nail only reaches surface and stops
        stateRef.current.penetrationDepth = 0;
        stateRef.current.targetNailY = WOOD_SURFACE_Y;
      }
    } else if (status === 'resetting') {
      stateRef.current.targetNailY = NAIL_HOVER_Y;
      stateRef.current.penetrationDepth = 0;
      stateRef.current.impactTriggered = false;
      if (soundEnabled) {
        soundManager.playReset();
      }
      // Jika posisi paku sudah di atas, segera selesaikan reset ke idle
      if (Math.abs(stateRef.current.nailY - NAIL_HOVER_Y) <= 0.005) {
        stateRef.current.status = 'idle';
        onAnimationComplete('idle');
      }
    } else if (status === 'idle') {
      stateRef.current.targetNailY = NAIL_HOVER_Y;
    }
  }, [status, forceN, areaCm2, wood, soundEnabled, onAnimationComplete]);

  // Handle camera preset changes
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'perspective') {
      s.cameraTargetPos.set(3.4, 2.6, 3.6);
      s.cameraTargetLookAt.set(0, 0.7, 0);
    } else if (cameraPreset === 'side') {
      s.cameraTargetPos.set(4.2, 0.8, 0.0);
      s.cameraTargetLookAt.set(0, 0.6, 0);
    } else if (cameraPreset === 'closeup') {
      s.cameraTargetPos.set(1.4, 1.1, 1.5);
      s.cameraTargetLookAt.set(0, 0.5, 0);
    } else if (cameraPreset === 'top') {
      s.cameraTargetPos.set(0.1, 5.0, 0.2);
      s.cameraTargetLookAt.set(0, 0.5, 0);
    }
  }, [cameraPreset]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e131b);
    scene.fog = new THREE.FogExp2(0x0e131b, 0.04);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.4, 2.6, 3.6);

    // 3. WebGL Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Lighting (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Warm key directional light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.4);
    keyLight.position.set(4, 7, 3);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 16;
      const d = 3.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool fill hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x90b4ce, 0x221a14, 0.85);
    scene.add(hemiLight);

    // Rim backlight for edge definition
    const rimLight = new THREE.DirectionalLight(0x70a0d0, 1.2);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    // 6. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 9.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent going underneath the table
    controls.target.set(0, 0.7, 0);
    controls.update();

    // -------------------------------------------------------------
    // 7. BUILD 3D PROCEDURAL ASSETS
    // -------------------------------------------------------------

    // A. Workbench Table Assembly
    const tableGroup = new THREE.Group();

    // Tabletop slab
    const tableTopGeo = new THREE.BoxGeometry(6.5, 0.3, 4.5);
    const tableTexture = createTableTexture();
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, -0.15, 0);
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // 4 Table Legs
    const legGeo = new THREE.BoxGeometry(0.24, 3.2, 0.24);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x252e3d,
      roughness: 0.5,
      metalness: 0.4,
    });
    const legFootMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.2,
      metalness: 0.8,
    });
    const footGeo = new THREE.BoxGeometry(0.26, 0.15, 0.26);

    const legOffsets = [
      { x: -2.9, z: -1.9 },
      { x: 2.9, z: -1.9 },
      { x: -2.9, z: 1.9 },
      { x: 2.9, z: 1.9 },
    ];
    legOffsets.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos.x, -1.75, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);

      const foot = new THREE.Mesh(footGeo, legFootMat);
      foot.position.set(pos.x, -3.28, pos.z);
      tableGroup.add(foot);
    });

    // Table Apron support beams
    const apronLongGeo = new THREE.BoxGeometry(5.8, 0.18, 0.08);
    const apronShortGeo = new THREE.BoxGeometry(0.08, 0.18, 3.8);
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x1a212b, roughness: 0.6, metalness: 0.3 });

    const apron1 = new THREE.Mesh(apronLongGeo, apronMat);
    apron1.position.set(0, -0.38, -1.9);
    tableGroup.add(apron1);

    const apron2 = new THREE.Mesh(apronLongGeo, apronMat);
    apron2.position.set(0, -0.38, 1.9);
    tableGroup.add(apron2);

    const apron3 = new THREE.Mesh(apronShortGeo, apronMat);
    apron3.position.set(-2.9, -0.38, 0);
    tableGroup.add(apron3);

    const apron4 = new THREE.Mesh(apronShortGeo, apronMat);
    apron4.position.set(2.9, -0.38, 0);
    tableGroup.add(apron4);

    scene.add(tableGroup);

    // Tabletop soft contact shadow beneath plank
    const shadowGeo = new THREE.PlaneGeometry(3.6, 2.4);
    const contactShadowTexture = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const plankShadow = new THREE.Mesh(shadowGeo, shadowMat);
    plankShadow.rotation.x = -Math.PI / 2;
    plankShadow.position.set(0, 0.002, 0);
    scene.add(plankShadow);

    // B. Wood Plank Specimen (Test Block)
    const plankGroup = new THREE.Group();
    const plankWidth = 2.6;
    const plankHeight = 0.5; // Top at Y = 0.5
    const plankDepth = 1.6;

    const plankGeo = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
    const woodTextures = createWoodTexture(wood.colorHex, wood.grainColorHex);
    const plankMat = new THREE.MeshStandardMaterial({
      map: woodTextures.colorMap,
      bumpMap: woodTextures.bumpMap,
      bumpScale: 0.015,
      roughness: 0.72,
      metalness: 0.04,
    });
    const plankMesh = new THREE.Mesh(plankGeo, plankMat);
    plankMesh.position.set(0, plankHeight / 2, 0);
    plankMesh.castShadow = true;
    plankMesh.receiveShadow = true;
    plankGroup.add(plankMesh);

    // Indentation hole / depression mark on the wood surface
    const dentGeo = new THREE.CylinderGeometry(0.12, 0.02, 0.04, 16);
    const dentMat = new THREE.MeshStandardMaterial({
      color: 0x2c1d11,
      roughness: 0.95,
      metalness: 0.0,
    });
    const dentMesh = new THREE.Mesh(dentGeo, dentMat);
    dentMesh.position.set(0, WOOD_SURFACE_Y - 0.01, 0);
    dentMesh.visible = false;
    plankGroup.add(dentMesh);

    scene.add(plankGroup);

    // C. 3-Part Composite Nail Assembly (`THREE.Group`)
    const nailGroup = new THREE.Group();
    nailGroup.position.set(0, NAIL_HOVER_Y, 0);

    // Steel material with PBR reflection
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      metalness: 0.96,
      roughness: 0.18,
    });

    const steelDarkMat = new THREE.MeshStandardMaterial({
      color: 0x858f9d,
      metalness: 0.92,
      roughness: 0.32,
    });

    // 1. Nail Head Cap
    const capGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32);
    const cap = new THREE.Mesh(capGeo, steelMat);
    cap.position.set(0, NAIL_LENGTH, 0);
    cap.castShadow = true;
    nailGroup.add(cap);

    // Cap beveled edge ring
    const capRingGeo = new THREE.TorusGeometry(0.31, 0.025, 12, 32);
    const capRing = new THREE.Mesh(capRingGeo, steelDarkMat);
    capRing.rotation.x = Math.PI / 2;
    capRing.position.set(0, NAIL_LENGTH - 0.01, 0);
    nailGroup.add(capRing);

    // 2. Nail Shank (Cylinder)
    const shankLength = 1.4;
    const shankGeo = new THREE.CylinderGeometry(0.08, 0.08, shankLength, 24);
    const shank = new THREE.Mesh(shankGeo, steelMat);
    shank.position.set(0, (NAIL_LENGTH - 0.04) - shankLength / 2, 0);
    shank.castShadow = true;
    nailGroup.add(shank);

    // Shank grip ridges (3 subtle rings)
    for (let r = 0; r < 4; r++) {
      const ridgeGeo = new THREE.TorusGeometry(0.084, 0.008, 8, 20);
      const ridge = new THREE.Mesh(ridgeGeo, steelDarkMat);
      ridge.rotation.x = Math.PI / 2;
      ridge.position.set(0, 1.45 - r * 0.12, 0);
      nailGroup.add(ridge);
    }

    // 3. Dynamic Tapered Tip (Updates when AreaCm2 changes)
    // Tip sits from Y = 0 to Y = 0.55
    const tipLength = 0.56;
    const tipContainer = new THREE.Group();
    tipContainer.position.set(0, 0, 0);
    nailGroup.add(tipContainer);

    // Initial tip mesh
    let currentTipMesh: THREE.Mesh | null = null;
    let currentTipDisc: THREE.Mesh | null = null;

    const updateTipGeometry = (area: number) => {
      if (currentTipMesh) {
        tipContainer.remove(currentTipMesh);
        currentTipMesh.geometry.dispose();
      }
      if (currentTipDisc) {
        tipContainer.remove(currentTipDisc);
        currentTipDisc.geometry.dispose();
      }

      // Radius in cm = sqrt(A / PI), scaled for 3D visual clarity:
      // When A = 0.1 cm² -> r is needle-point (~0.012 units)
      // When A = 5.0 cm² -> r is blunt flat cylinder (~0.12 units)
      const tipRadius = Math.max(0.008, Math.sqrt(area / Math.PI) * 0.065);
      const shankRadius = 0.08;

      // Truncated cone geometry
      const tipGeo = new THREE.CylinderGeometry(shankRadius, tipRadius, tipLength, 24);
      currentTipMesh = new THREE.Mesh(tipGeo, steelMat);
      currentTipMesh.position.set(0, tipLength / 2, 0);
      currentTipMesh.castShadow = true;
      tipContainer.add(currentTipMesh);

      // Colored disk indicator right at the tip point
      const discGeo = new THREE.CircleGeometry(tipRadius, 24);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
      });
      currentTipDisc = new THREE.Mesh(discGeo, discMat);
      currentTipDisc.rotation.x = Math.PI / 2;
      currentTipDisc.position.set(0, 0.002, 0);
      tipContainer.add(currentTipDisc);
    };

    updateTipGeometry(stateRef.current.areaCm2);
    scene.add(nailGroup);

    // D. 3D Force Vector Arrow above the nail
    const forceGroup = new THREE.Group();
    forceGroup.position.set(0, NAIL_HOVER_Y + NAIL_LENGTH + 0.1, 0);

    const arrowShaftGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.8, 16);
    const arrowConeGeo = new THREE.ConeGeometry(0.09, 0.25, 16);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.1,
    });

    const arrowShaft = new THREE.Mesh(arrowShaftGeo, arrowMat);
    arrowShaft.position.set(0, 0.45, 0);
    forceGroup.add(arrowShaft);

    const arrowCone = new THREE.Mesh(arrowConeGeo, arrowMat);
    arrowCone.rotation.x = Math.PI; // Point downwards towards nail
    arrowCone.position.set(0, 0.12, 0);
    forceGroup.add(arrowCone);

    scene.add(forceGroup);

    // E. Sawdust / Wood Splinter Particle System (`InstancedMesh`)
    const particleCount = 180;
    const particleGeo = new THREE.BoxGeometry(0.025, 0.015, 0.035);
    const particleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wood.grainColorHex),
      roughness: 0.9,
      metalness: 0.0,
    });
    const particles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particles.visible = false;
    scene.add(particles);

    // Particle physical kinematics state
    const particleVelocities: THREE.Vector3[] = [];
    const particlePositions: THREE.Vector3[] = [];
    const particleRotations: THREE.Euler[] = [];
    const particleRotSpeeds: THREE.Vector3[] = [];
    const particleActive: boolean[] = [];

    for (let i = 0; i < particleCount; i++) {
      particleVelocities.push(new THREE.Vector3());
      particlePositions.push(new THREE.Vector3());
      particleRotations.push(new THREE.Euler());
      particleRotSpeeds.push(new THREE.Vector3());
      particleActive.push(false);
    }

    const triggerSawdust = () => {
      particles.visible = true;
      const dummy = new THREE.Object3D();

      for (let i = 0; i < particleCount; i++) {
        particleActive[i] = true;
        // Origin at impact point on wood surface
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.2;
        const upwardSpeed = 1.2 + Math.random() * 2.4;

        particlePositions[i].set(
          (Math.random() - 0.5) * 0.08,
          WOOD_SURFACE_Y + 0.02,
          (Math.random() - 0.5) * 0.08
        );

        particleVelocities[i].set(
          Math.cos(angle) * speed,
          upwardSpeed,
          Math.sin(angle) * speed
        );

        particleRotations[i].set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        particleRotSpeeds[i].set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );

        dummy.position.copy(particlePositions[i]);
        dummy.rotation.copy(particleRotations[i]);
        dummy.scale.set(0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8);
        dummy.updateMatrix();
        particles.setMatrixAt(i, dummy.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
    };

    const resetSawdust = () => {
      particles.visible = false;
      for (let i = 0; i < particleCount; i++) {
        particleActive[i] = false;
      }
    };

    // -------------------------------------------------------------
    // 8. ANIMATION LOOP & KINEMATICS
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameId = 0;
    let prevArea = stateRef.current.areaCm2;
    let prevWoodId = stateRef.current.wood.id;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const dummy = new THREE.Object3D();

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      // Check if wood material changed
      if (s.wood.id !== prevWoodId) {
        prevWoodId = s.wood.id;
        const newTextures = createWoodTexture(s.wood.colorHex, s.wood.grainColorHex);
        plankMat.map = newTextures.colorMap;
        plankMat.bumpMap = newTextures.bumpMap;
        plankMat.needsUpdate = true;
        particleMat.color.set(s.wood.grainColorHex);
      }

      // Check if tip geometry needs updating
      if (Math.abs(s.areaCm2 - prevArea) > 0.01) {
        prevArea = s.areaCm2;
        updateTipGeometry(s.areaCm2);
      }

      // 1. Nail Movement Kinematics
      const dist = s.targetNailY - s.nailY;
      if (Math.abs(dist) > 0.002) {
        const speed = s.status === 'resetting' ? 7.0 : 6.0;
        s.nailY += dist * Math.min(1.0, speed * delta);
        nailGroup.position.y = s.nailY;

        // Check if nail just hit surface
        if (!s.impactTriggered && s.status === 'pressing' && s.nailY <= WOOD_SURFACE_Y + 0.04) {
          s.impactTriggered = true;
          if (s.penetrationDepth > 0) {
            // Success Penetrate
            triggerSawdust();
            dentMesh.visible = true;
            dentMesh.scale.set(1.2 + s.areaCm2 * 0.2, 1.0, 1.2 + s.areaCm2 * 0.2);
            if (s.soundEnabled) soundManager.playPenetrationCrack();
          } else {
            // Stopped at surface
            if (s.soundEnabled) soundManager.playSurfaceThud();
          }
        }
      } else {
        s.nailY = s.targetNailY;
        nailGroup.position.y = s.nailY;

        // Notify parent on transition finish
        if (s.status === 'pressing') {
          if (s.penetrationDepth > 0) {
            s.onAnimationComplete('penetrated');
          } else {
            s.onAnimationComplete('stopped_surface');
          }
        } else if (s.status === 'resetting') {
          resetSawdust();
          dentMesh.visible = false;
          s.status = 'idle';
          s.onAnimationComplete('idle');
        }
      }

      // 2. Force Vector Arrow Position & Scale
      const forceScale = Math.max(0.1, s.forceN / 50.0);
      forceGroup.position.set(0, s.nailY + NAIL_LENGTH + 0.05, 0);
      arrowShaft.scale.set(1, forceScale, 1);
      arrowShaft.position.set(0, 0.4 * forceScale, 0);
      arrowCone.position.set(0, 0.1, 0);

      // Arrow color shifts: green for low force -> bright orange/red for high force
      const forceNorm = Math.min(1.0, s.forceN / 100);
      const arrowColor = new THREE.Color().setHSL(0.33 * (1 - forceNorm), 0.9, 0.5);
      arrowMat.color.copy(arrowColor);
      arrowMat.emissive.copy(arrowColor);

      // Hide force arrow if force is zero or during reset
      forceGroup.visible = s.forceN > 0 && s.status !== 'resetting';

      // 3. Sawdust particles physics
      if (particles.visible) {
        let anyActive = false;
        for (let i = 0; i < particleCount; i++) {
          if (!particleActive[i]) continue;

          // Apply gravity
          particleVelocities[i].y -= 9.8 * delta;

          // Update position
          particlePositions[i].x += particleVelocities[i].x * delta;
          particlePositions[i].y += particleVelocities[i].y * delta;
          particlePositions[i].z += particleVelocities[i].z * delta;

          // Tumble rotation
          particleRotations[i].x += particleRotSpeeds[i].x * delta;
          particleRotations[i].y += particleRotSpeeds[i].y * delta;
          particleRotations[i].z += particleRotSpeeds[i].z * delta;

          // Wood plank collision bounce / settle
          if (particlePositions[i].y <= WOOD_SURFACE_Y + 0.005) {
            particlePositions[i].y = WOOD_SURFACE_Y + 0.005;
            particleVelocities[i].y *= -0.35; // bounce damp
            particleVelocities[i].x *= 0.65; // friction
            particleVelocities[i].z *= 0.65;
            if (Math.abs(particleVelocities[i].y) < 0.1) {
              particleVelocities[i].set(0, 0, 0);
            }
          }

          dummy.position.copy(particlePositions[i]);
          dummy.rotation.copy(particleRotations[i]);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          particles.setMatrixAt(i, dummy.matrix);
          anyActive = true;
        }
        if (anyActive) {
          particles.instanceMatrix.needsUpdate = true;
        }
      }

      // 4. Smooth Camera Lerp when preset changes
      camera.position.lerp(s.cameraTargetPos, Math.min(1.0, 3.5 * delta));
      controls.target.lerp(s.cameraTargetLookAt, Math.min(1.0, 3.5 * delta));
      controls.update();

      // Render scene
      renderer.render(scene, camera);

      // Only schedule next frame if this tab is active
      if (s.isActive) {
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      }
    }

    const startOrResumeLoop = () => {
      cancelAnimationFrame(frameId);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };
    resumeLoopRef.current = startOrResumeLoop;

    // Start loop if active initially
    if (stateRef.current.isActive) {
      startOrResumeLoop();
    }

    // Window & Container Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Initial check
    handleResize();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none touch-none"
    />
  );
};
