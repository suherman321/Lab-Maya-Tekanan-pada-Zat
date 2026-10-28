/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createContactShadowTexture, createTableTexture } from '../utils/proceduralTextures.ts';
import { GAS_INITIAL_V, GAS_INITIAL_P, GAS_CONSTANT_PV } from '../types/gas.ts';

interface Gas3DSimulationProps {
  volumeCm3: number;
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'closeup';
  isActive: boolean;
}

const CYL_RADIUS = 0.95;
const CYL_BASE_Y = 0.25;
const MIN_PISTON_Y = 0.65; // At V = 20 cm³
const MAX_PISTON_Y = 2.45; // At V = 100 cm³
const PARTICLE_COUNT = 130;
const PARTICLE_RADIUS = 0.045;

export const Gas3DSimulation: React.FC<Gas3DSimulationProps> = ({
  volumeCm3,
  cameraPreset,
  isActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    volumeCm3,
    cameraPreset,
    isActive,
    pistonY: MAX_PISTON_Y,
    targetPistonY: MAX_PISTON_Y,
    cameraTargetPos: new THREE.Vector3(0, 2.2, 4.8),
    cameraTargetLookAt: new THREE.Vector3(0, 1.3, 0),
  });

  // Calculate target piston Y from volume
  const getPistonYFromVolume = (v: number) => {
    const fraction = (v - 20) / (100 - 20);
    return MIN_PISTON_Y + fraction * (MAX_PISTON_Y - MIN_PISTON_Y);
  };

  useEffect(() => {
    stateRef.current.volumeCm3 = volumeCm3;
    stateRef.current.targetPistonY = getPistonYFromVolume(volumeCm3);
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.isActive = isActive;
  }, [volumeCm3, cameraPreset, isActive]);

  // Handle camera presets
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'perspective') {
      s.cameraTargetPos.set(0, 2.2, 4.8);
      s.cameraTargetLookAt.set(0, 1.3, 0);
    } else if (cameraPreset === 'front') {
      s.cameraTargetPos.set(0, 1.4, 4.2);
      s.cameraTargetLookAt.set(0, 1.3, 0);
    } else if (cameraPreset === 'closeup') {
      s.cameraTargetPos.set(0, 1.3, 2.8);
      s.cameraTargetLookAt.set(0, 1.2, 0);
    }
  }, [cameraPreset]);

  // Resume animation loop when tab becomes active
  useEffect(() => {
    stateRef.current.isActive = isActive;
    if (isActive && resumeLoopRef.current) {
      resumeLoopRef.current();
    }
  }, [isActive]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090e17);
    scene.fog = new THREE.FogExp2(0x090e17, 0.04);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 4.8);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lights
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    keyLight.position.set(3, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 3.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-3.5, 3, -3);
    scene.add(rimLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 9.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 1.3, 0);
    controls.update();

    // -------------------------------------------------------------
    // BUILD 3D GAS CYLINDER & PISTON
    // -------------------------------------------------------------

    // 1. Table with contact shadow
    const tableGroup = new THREE.Group();
    const tableTexture = createTableTexture();
    const tableTopGeo = new THREE.BoxGeometry(6.0, 0.3, 4.5);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, -0.15, 0);
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const shadowGeo = new THREE.PlaneGeometry(4.0, 3.0);
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const tableShadow = new THREE.Mesh(shadowGeo, shadowMat);
    tableShadow.rotation.x = -Math.PI / 2;
    tableShadow.position.set(0, 0.002, 0);
    tableGroup.add(tableShadow);

    scene.add(tableGroup);

    // 2. Heavy Metal Cylinder Base Manifold
    const baseGeo = new THREE.CylinderGeometry(CYL_RADIUS * 1.35, CYL_RADIUS * 1.4, 0.28, 36);
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, darkMetalMat);
    baseMesh.position.set(0, 0.14, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // 3. Transparent Glass Cylinder Chamber
    const cylTotalH = 2.6;
    const glassGeo = new THREE.CylinderGeometry(CYL_RADIUS + 0.03, CYL_RADIUS + 0.03, cylTotalH, 36, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.85,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.52,
    });
    const glassCyl = new THREE.Mesh(glassGeo, glassMat);
    glassCyl.position.set(0, CYL_BASEY_OFFSET(cylTotalH), 0);
    scene.add(glassCyl);

    function CYL_BASEY_OFFSET(h: number) {
      return CYL_BASE_Y + h / 2;
    }

    // Cylinder Top Metallic Flange
    const flangeGeo = new THREE.TorusGeometry(CYL_RADIUS + 0.03, 0.035, 12, 36);
    const topFlange = new THREE.Mesh(flangeGeo, darkMetalMat);
    topFlange.rotation.x = Math.PI / 2;
    topFlange.position.set(0, CYL_BASE_Y + cylTotalH, 0);
    scene.add(topFlange);

    // Graduated Tick Marks on glass (Volume levels 20 to 100 cm³)
    const tickGroup = new THREE.Group();
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let v = 20; v <= 100; v += 20) {
      const fraction = (v - 20) / (100 - 20);
      const y = MIN_PISTON_Y + fraction * (MAX_PISTON_Y - MIN_PISTON_Y);
      const tickGeo = new THREE.BoxGeometry(0.18, 0.015, 0.02);
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(CYL_RADIUS + 0.04, y, 0);
      tickGroup.add(tick);
    }
    scene.add(tickGroup);

    // 4. Pressure Gauge Unit attached to the side
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(-CYL_RADIUS - 0.22, 1.2, 0);

    // Bracket pipe
    const bracketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12);
    const bracket = new THREE.Mesh(bracketGeo, darkMetalMat);
    bracket.rotation.z = Math.PI / 2;
    gaugeGroup.add(bracket);

    // Dial Casing
    const dialCasingGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 32);
    const dialCasing = new THREE.Mesh(dialCasingGeo, darkMetalMat);
    dialCasing.rotation.x = Math.PI / 2;
    dialCasing.position.set(-0.16, 0, 0);
    gaugeGroup.add(dialCasing);

    // Dial Face Plate
    const dialFaceGeo = new THREE.CircleGeometry(0.32, 32);
    const dialFaceMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const dialFace = new THREE.Mesh(dialFaceGeo, dialFaceMat);
    dialFace.position.set(-0.16, 0, 0.065);
    gaugeGroup.add(dialFace);

    // Dial Needle
    const needleGeo = new THREE.BoxGeometry(0.02, 0.24, 0.01);
    needleGeo.translate(0, 0.1, 0);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.set(-0.16, 0, 0.07);
    gaugeGroup.add(needle);

    scene.add(gaugeGroup);

    // 5. Compression Piston Group (Moves Vertically)
    const pistonGroup = new THREE.Group();
    pistonGroup.position.set(0, MAX_PISTON_Y, 0);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.16,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Piston Head
    const pHeadGeo = new THREE.CylinderGeometry(CYL_RADIUS - 0.01, CYL_RADIUS - 0.01, 0.18, 36);
    const pHead = new THREE.Mesh(pHeadGeo, chromeMat);
    pHead.castShadow = true;
    pistonGroup.add(pHead);

    // O-Ring Seal around piston
    const pRingGeo = new THREE.TorusGeometry(CYL_RADIUS - 0.01, 0.02, 8, 36);
    const pRing = new THREE.Mesh(pRingGeo, rubberMat);
    pRing.rotation.x = Math.PI / 2;
    pistonGroup.add(pRing);

    // Vertical Shaft Rod
    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 20);
    const rod = new THREE.Mesh(rodGeo, chromeMat);
    rod.position.set(0, 0.75, 0);
    rod.castShadow = true;
    pistonGroup.add(rod);

    // Handle Grip on top
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.4,
    });
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16), handleMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.45, 0);
    handleBar.castShadow = true;
    pistonGroup.add(handleBar);

    scene.add(pistonGroup);

    // -------------------------------------------------------------
    // KINETIC GAS PARTICLES (`InstancedMesh`)
    // -------------------------------------------------------------
    const particleGeo = new THREE.SphereGeometry(PARTICLE_RADIUS, 12, 12);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.2,
    });
    const particles = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particles);

    // Particle physical kinematics vectors
    const pPos: THREE.Vector3[] = [];
    const pVel: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();

    const initialPistonY = getPistonYFromVolume(stateRef.current.volumeCm3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random position inside cylinder
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (CYL_RADIUS - PARTICLE_RADIUS * 2);
      const y = CYL_BASE_Y + PARTICLE_RADIUS + Math.random() * (initialPistonY - CYL_BASE_Y - PARTICLE_RADIUS * 2);

      pPos.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));

      // Random 3D velocity vector
      const speed = 1.2 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pVel.push(
        new THREE.Vector3(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed,
          Math.sin(theta) * Math.cos(phi) * speed
        )
      );

      dummy.position.copy(pPos[i]);
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;

    // -------------------------------------------------------------
    // ANIMATION & KINEMATICS LOOP
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameId = 0;

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

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.08);
      const s = stateRef.current;

      // 1. Smooth Piston Motion
      s.pistonY += (s.targetPistonY - s.pistonY) * Math.min(1.0, 5.0 * delta);
      pistonGroup.position.y = s.pistonY;

      // 2. Boyle's Law: P = k / V
      const currentP = GAS_CONSTANT_PV / s.volumeCm3;
      // Kinetic speed multiplier: increases as volume shrinks
      const speedMultiplier = Math.pow(GAS_INITIAL_V / s.volumeCm3, 0.45);

      // Color shifts: cyan at 100 kPa -> amber -> bright red at 500 kPa
      const normP = Math.min(1.0, Math.max(0, (currentP - 100) / 400));
      const pColor = new THREE.Color().setHSL(0.55 - normP * 0.55, 0.95, 0.5);
      particleMat.color.copy(pColor);
      particleMat.emissive.copy(pColor);

      // 3. Needle rotation on gauge (-45 deg to 135 deg)
      const needleAngle = -0.7 + normP * 2.8;
      needle.rotation.z = -needleAngle;

      // 4. Update Particle Kinematics & Boundary Collisions
      const bottomLimit = CYL_BASE_Y + PARTICLE_RADIUS;
      const topLimit = s.pistonY - 0.09 - PARTICLE_RADIUS;
      const radialLimit = CYL_RADIUS - PARTICLE_RADIUS;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pos = pPos[i];
        const vel = pVel[i];

        // Move particle with speed multiplier
        pos.x += vel.x * speedMultiplier * delta;
        pos.y += vel.y * speedMultiplier * delta;
        pos.z += vel.z * speedMultiplier * delta;

        // Radial cylinder wall collision
        const distSq = pos.x * pos.x + pos.z * pos.z;
        if (distSq >= radialLimit * radialLimit) {
          const dist = Math.sqrt(distSq);
          const nx = pos.x / dist;
          const nz = pos.z / dist;

          // Reflect velocity across radial normal
          const dot = vel.x * nx + vel.z * nz;
          vel.x = (vel.x - 2 * dot * nx);
          vel.z = (vel.z - 2 * dot * nz);

          // Push back inside boundary
          pos.x = nx * (radialLimit - 0.005);
          pos.z = nz * (radialLimit - 0.005);
        }

        // Vertical floor collision
        if (pos.y <= bottomLimit) {
          pos.y = bottomLimit + 0.005;
          vel.y = Math.abs(vel.y);
        }

        // Vertical piston head collision
        if (pos.y >= topLimit) {
          pos.y = topLimit - 0.005;
          vel.y = -Math.abs(vel.y);
        }

        dummy.position.copy(pos);
        dummy.updateMatrix();
        particles.setMatrixAt(i, dummy.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;

      // Camera lerp
      camera.position.lerp(s.cameraTargetPos, Math.min(1.0, 3.5 * delta));
      controls.target.lerp(s.cameraTargetLookAt, Math.min(1.0, 3.5 * delta));
      controls.update();

      // Render
      renderer.render(scene, camera);

      // Only schedule next frame if active
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

    if (stateRef.current.isActive) {
      startOrResumeLoop();
    }

    // Resize Observer
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
    handleResize();

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
