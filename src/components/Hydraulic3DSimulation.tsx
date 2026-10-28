/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createContactShadowTexture, createTableTexture } from '../utils/proceduralTextures.ts';
import { soundManager } from '../utils/soundEffects.ts';

interface Hydraulic3DSimulationProps {
  force1: number;
  areaRatio: number;
  loadWeight: number;
  isPumped: boolean;
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'piston';
  isActive: boolean;
}

const CYLINDER_BASE_Y = 0.2;
const INITIAL_FLUID_HEIGHT = 1.2;
const MAX_STROKE_1 = 0.85; // Max displacement of piston 1

export const Hydraulic3DSimulation: React.FC<Hydraulic3DSimulationProps> = ({
  force1,
  areaRatio,
  loadWeight,
  isPumped,
  soundEnabled,
  cameraPreset,
  isActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    force1,
    areaRatio,
    loadWeight,
    isPumped,
    soundEnabled,
    cameraPreset,
    isActive,
    // Animation kinematics
    piston1Disp: 0,       // Displacement of piston 1 (downward > 0)
    targetPiston1Disp: 0,
    piston2Disp: 0,       // Displacement of piston 2 (upward > 0)
    targetPiston2Disp: 0,
    cameraTargetPos: new THREE.Vector3(0, 2.5, 5.2),
    cameraTargetLookAt: new THREE.Vector3(0, 1.2, 0),
  });

  // Keep stateRef in sync with props
  useEffect(() => {
    stateRef.current.force1 = force1;
    stateRef.current.areaRatio = areaRatio;
    stateRef.current.loadWeight = loadWeight;
    stateRef.current.soundEnabled = soundEnabled;
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.isActive = isActive;

    const f2 = force1 * areaRatio;
    const canLift = f2 >= loadWeight && force1 > 0;

    if (isPumped) {
      if (canLift) {
        stateRef.current.targetPiston1Disp = MAX_STROKE_1;
        stateRef.current.targetPiston2Disp = MAX_STROKE_1 / areaRatio;
        if (soundEnabled) soundManager.playWhoosh();
      } else {
        // Insufficient force: piston 1 slightly depresses against pressure then stops, piston 2 cannot lift
        stateRef.current.targetPiston1Disp = 0.08;
        stateRef.current.targetPiston2Disp = 0;
        if (soundEnabled) soundManager.playSurfaceThud();
      }
    } else {
      // Released / Return to rest
      stateRef.current.targetPiston1Disp = 0;
      stateRef.current.targetPiston2Disp = 0;
      if (soundEnabled && stateRef.current.piston1Disp > 0.1) {
        soundManager.playReset();
      }
    }
    stateRef.current.isPumped = isPumped;
  }, [force1, areaRatio, loadWeight, isPumped, soundEnabled, cameraPreset, isActive]);

  // Handle camera presets
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'perspective') {
      s.cameraTargetPos.set(0, 2.5, 5.2);
      s.cameraTargetLookAt.set(0, 1.2, 0);
    } else if (cameraPreset === 'front') {
      s.cameraTargetPos.set(0, 1.4, 4.6);
      s.cameraTargetLookAt.set(0, 1.1, 0);
    } else if (cameraPreset === 'piston') {
      s.cameraTargetPos.set(-1.8, 1.8, 2.8);
      s.cameraTargetLookAt.set(-1.4, 1.3, 0);
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
    scene.background = new THREE.Color(0x0a0f16);
    scene.fog = new THREE.FogExp2(0x0a0f16, 0.04);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.2);

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
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    keyLight.position.set(3.5, 6.5, 4.0);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 4.0;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x8bc34a, 0x1b2838, 0.8);
    scene.add(hemiLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 10.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 1.2, 0);
    controls.update();

    // -------------------------------------------------------------
    // BUILD HYDRAULIC JACK 3D SCENE
    // -------------------------------------------------------------

    // 1. Heavy Workshop Table
    const tableGroup = new THREE.Group();
    const tableTexture = createTableTexture();
    const tableTopGeo = new THREE.BoxGeometry(7.0, 0.3, 4.5);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, -0.15, 0);
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Soft contact shadow
    const shadowGeo = new THREE.PlaneGeometry(5.0, 3.0);
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const tableShadow = new THREE.Mesh(shadowGeo, shadowMat);
    tableShadow.rotation.x = -Math.PI / 2;
    tableShadow.position.set(0, 0.002, 0);
    tableGroup.add(tableShadow);

    scene.add(tableGroup);

    // 2. Base Manifold Block (Hydraulic base with cross-channel)
    const baseGeo = new THREE.BoxGeometry(4.2, 0.25, 2.0);
    const metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseGeo, metalDarkMat);
    baseMesh.position.set(0, 0.125, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Transparent Connecting Pipe between cylinders
    const pipeOuterGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 24);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 0.85,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
    });
    const pipeOuter = new THREE.Mesh(pipeOuterGeo, glassMat);
    pipeOuter.rotation.z = Math.PI / 2;
    pipeOuter.position.set(-0.1, 0.35, 0);
    scene.add(pipeOuter);

    // Blue Fluid inside Connecting Pipe
    const fluidMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.1,
    });
    const pipeFluidGeo = new THREE.CylinderGeometry(0.11, 0.11, 2.4, 24);
    const pipeFluid = new THREE.Mesh(pipeFluidGeo, fluidMat);
    pipeFluid.rotation.z = Math.PI / 2;
    pipeFluid.position.set(-0.1, 0.35, 0);
    scene.add(pipeFluid);

    // PBR Chrome Steel Material for Pistons
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.15,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.05,
    });

    // -------------------------------------------------------------
    // CYLINDER 1 (Small Input Cylinder, Left)
    // -------------------------------------------------------------
    const pos1X = -1.4;
    const r1 = 0.32;
    const cylHeight = 2.2;

    // Glass cylinder 1
    const cyl1Geo = new THREE.CylinderGeometry(r1 + 0.04, r1 + 0.04, cylHeight, 32, 1, true);
    const cyl1Glass = new THREE.Mesh(cyl1Geo, glassMat);
    cyl1Glass.position.set(pos1X, CYLINDER_BASE_Y + cylHeight / 2, 0);
    scene.add(cyl1Glass);

    // Cylinder 1 metal base and top rims
    const rimGeo1 = new THREE.TorusGeometry(r1 + 0.04, 0.025, 12, 32);
    const rim1Top = new THREE.Mesh(rimGeo1, metalDarkMat);
    rim1Top.rotation.x = Math.PI / 2;
    rim1Top.position.set(pos1X, CYLINDER_BASE_Y + cylHeight, 0);
    scene.add(rim1Top);

    // Fluid column 1 (Mesh scaled dynamically)
    const fluid1Geo = new THREE.CylinderGeometry(r1, r1, 1.0, 32);
    const fluid1Mesh = new THREE.Mesh(fluid1Geo, fluidMat);
    fluid1Mesh.position.set(pos1X, CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT / 2, 0);
    fluid1Mesh.scale.set(1, INITIAL_FLUID_HEIGHT, 1);
    scene.add(fluid1Mesh);

    // Piston 1 Group (Moves down)
    const piston1Group = new THREE.Group();
    piston1Group.position.set(pos1X, CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT, 0);

    // Piston 1 Head
    const p1HeadGeo = new THREE.CylinderGeometry(r1 - 0.005, r1 - 0.005, 0.12, 32);
    const p1Head = new THREE.Mesh(p1HeadGeo, chromeMat);
    p1Head.castShadow = true;
    piston1Group.add(p1Head);

    // O-ring seal
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(r1 - 0.005, 0.015, 8, 32), rubberMat);
    ring1.rotation.x = Math.PI / 2;
    piston1Group.add(ring1);

    // Push rod 1
    const rod1Geo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 16);
    const rod1 = new THREE.Mesh(rod1Geo, chromeMat);
    rod1.position.set(0, 0.6, 0);
    rod1.castShadow = true;
    piston1Group.add(rod1);

    // Handle button on top
    const handleGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.4 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 1.2, 0);
    handle.castShadow = true;
    piston1Group.add(handle);

    // Downward Force Arrow F1
    const arrowF1Group = new THREE.Group();
    arrowF1Group.position.set(0, 1.35, 0);
    const arrowShaftF1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 12), handleMat);
    arrowShaftF1.position.set(0, 0.35, 0);
    arrowF1Group.add(arrowShaftF1);
    const arrowConeF1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 16), handleMat);
    arrowConeF1.rotation.x = Math.PI; // point down
    arrowConeF1.position.set(0, 0.1, 0);
    arrowF1Group.add(arrowConeF1);
    piston1Group.add(arrowF1Group);

    scene.add(piston1Group);

    // -------------------------------------------------------------
    // CYLINDER 2 (Large Output Cylinder, Right - Dynamic Radius!)
    // -------------------------------------------------------------
    const pos2X = 1.2;
    const cyl2Container = new THREE.Group();
    cyl2Container.position.set(pos2X, 0, 0);
    scene.add(cyl2Container);

    let cyl2Glass: THREE.Mesh | null = null;
    let fluid2Mesh: THREE.Mesh | null = null;
    let piston2Group: THREE.Group | null = null;
    let loadMesh: THREE.Mesh | null = null;
    let arrowF2Group: THREE.Group | null = null;

    const buildCylinder2 = (ratio: number) => {
      // Clear old meshes in cyl2Container
      while (cyl2Container.children.length > 0) {
        const obj = cyl2Container.children[0];
        cyl2Container.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }

      // Radius scales with sqrt(ratio) so Area2 = ratio * Area1
      // When ratio = 4 -> r2 = 2 * r1 = 0.64
      // When ratio = 9 -> r2 = 3 * r1 = 0.96
      // Clamp r2 for clean aesthetics between 0.52 and 1.05
      const r2 = Math.min(1.05, Math.max(0.52, r1 * Math.sqrt(ratio) * 0.72));

      // 1. Glass cylinder 2
      const cyl2Geo = new THREE.CylinderGeometry(r2 + 0.04, r2 + 0.04, cylHeight, 36, 1, true);
      cyl2Glass = new THREE.Mesh(cyl2Geo, glassMat);
      cyl2Glass.position.set(0, CYLINDER_BASE_Y + cylHeight / 2, 0);
      cyl2Container.add(cyl2Glass);

      // Top metal rim
      const rimGeo2 = new THREE.TorusGeometry(r2 + 0.04, 0.03, 12, 36);
      const rim2Top = new THREE.Mesh(rimGeo2, metalDarkMat);
      rim2Top.rotation.x = Math.PI / 2;
      rim2Top.position.set(0, CYLINDER_BASE_Y + cylHeight, 0);
      cyl2Container.add(rim2Top);

      // 2. Fluid 2 Mesh (scaled dynamically in tick loop)
      const fluid2Geo = new THREE.CylinderGeometry(r2, r2, 1.0, 36);
      fluid2Mesh = new THREE.Mesh(fluid2Geo, fluidMat);
      fluid2Mesh.position.set(0, CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT / 2, 0);
      fluid2Mesh.scale.set(1, INITIAL_FLUID_HEIGHT, 1);
      cyl2Container.add(fluid2Mesh);

      // 3. Piston 2 Group
      piston2Group = new THREE.Group();
      piston2Group.position.set(0, CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT, 0);

      // Piston 2 Head
      const p2HeadGeo = new THREE.CylinderGeometry(r2 - 0.005, r2 - 0.005, 0.16, 36);
      const p2Head = new THREE.Mesh(p2HeadGeo, chromeMat);
      p2Head.castShadow = true;
      piston2Group.add(p2Head);

      // O-ring seal
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r2 - 0.005, 0.02, 8, 36), rubberMat);
      ring2.rotation.x = Math.PI / 2;
      piston2Group.add(ring2);

      // Sturdy platform elevator plate
      const platGeo = new THREE.CylinderGeometry(r2 * 1.15, r2 * 1.15, 0.1, 36);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(0, 0.12, 0);
      plat.castShadow = true;
      piston2Group.add(plat);

      // Heavy Weight Box / Load Crate sitting on platform
      const boxSize = Math.max(0.65, r2 * 1.25);
      const crateGeo = new THREE.BoxGeometry(boxSize, boxSize * 0.8, boxSize);
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        roughness: 0.6,
        metalness: 0.3,
      });
      loadMesh = new THREE.Mesh(crateGeo, crateMat);
      loadMesh.position.set(0, 0.18 + (boxSize * 0.8) / 2, 0);
      loadMesh.castShadow = true;
      piston2Group.add(loadMesh);

      // Upward Force Arrow F2
      const arrowGreenMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      });
      arrowF2Group = new THREE.Group();
      arrowF2Group.position.set(0, 0.2 + boxSize * 0.8 + 0.1, 0);
      const shaftF2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), arrowGreenMat);
      shaftF2.position.set(0, 0.35, 0);
      arrowF2Group.add(shaftF2);
      const coneF2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 16), arrowGreenMat);
      coneF2.position.set(0, 0.75, 0); // point up
      arrowF2Group.add(coneF2);
      piston2Group.add(arrowF2Group);

      cyl2Container.add(piston2Group);
    };

    buildCylinder2(stateRef.current.areaRatio);

    // -------------------------------------------------------------
    // FLOW PARTICLES (Little bubbles moving through horizontal pipe)
    // -------------------------------------------------------------
    const bubbleCount = 20;
    const bubbleGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleCount);
    const bubbleX: number[] = [];
    const bubbleSpeed = 1.8;

    for (let i = 0; i < bubbleCount; i++) {
      bubbleX.push(pos1X + Math.random() * (pos2X - pos1X));
    }
    bubbles.position.set(0, 0.35, 0);
    scene.add(bubbles);

    const dummy = new THREE.Object3D();

    // -------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameId = 0;
    let prevRatio = stateRef.current.areaRatio;

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
      const delta = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      // Rebuild Cylinder 2 if ratio changed
      if (Math.abs(s.areaRatio - prevRatio) > 0.05) {
        prevRatio = s.areaRatio;
        buildCylinder2(s.areaRatio);
      }

      // Smooth kinematics for Piston 1 (Downwards displacement)
      const p1Speed = 3.5;
      s.piston1Disp += (s.targetPiston1Disp - s.piston1Disp) * Math.min(1.0, p1Speed * delta);
      piston1Group.position.y = CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT - s.piston1Disp;

      // Fluid 1 column shrinks proportionally
      const fluid1H = Math.max(0.1, INITIAL_FLUID_HEIGHT - s.piston1Disp);
      fluid1Mesh.scale.y = fluid1H;
      fluid1Mesh.position.y = CYLINDER_BASE_Y + fluid1H / 2;

      // Smooth kinematics for Piston 2 (Upwards displacement)
      const p2Speed = 3.5;
      s.piston2Disp += (s.targetPiston2Disp - s.piston2Disp) * Math.min(1.0, p2Speed * delta);

      if (piston2Group && fluid2Mesh) {
        piston2Group.position.y = CYLINDER_BASE_Y + INITIAL_FLUID_HEIGHT + s.piston2Disp;
        const fluid2H = INITIAL_FLUID_HEIGHT + s.piston2Disp;
        fluid2Mesh.scale.y = fluid2H;
        fluid2Mesh.position.y = CYLINDER_BASE_Y + fluid2H / 2;
      }

      // Update Force Arrows visibility & scale
      if (arrowF1Group) {
        arrowF1Group.visible = s.force1 > 0;
        const f1Scale = Math.max(0.2, s.force1 / 100);
        arrowF1Group.scale.set(1, f1Scale, 1);
      }
      if (arrowF2Group) {
        const f2 = s.force1 * s.areaRatio;
        arrowF2Group.visible = f2 > 0;
        const f2Scale = Math.max(0.2, f2 / 500);
        arrowF2Group.scale.set(1, Math.min(2.0, f2Scale), 1);
      }

      // Animate flowing bubbles when pumped and fluid moving
      if (s.isPumped && s.piston1Disp < s.targetPiston1Disp - 0.01) {
        bubbles.visible = true;
        for (let i = 0; i < bubbleCount; i++) {
          bubbleX[i] += bubbleSpeed * delta;
          if (bubbleX[i] > pos2X) {
            bubbleX[i] = pos1X;
          }
          dummy.position.set(bubbleX[i], 0, (Math.random() - 0.5) * 0.08);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          bubbles.setMatrixAt(i, dummy.matrix);
        }
        bubbles.instanceMatrix.needsUpdate = true;
      } else {
        bubbles.visible = false;
      }

      // Smooth camera interpolation
      camera.position.lerp(s.cameraTargetPos, Math.min(1.0, 3.5 * delta));
      controls.target.lerp(s.cameraTargetLookAt, Math.min(1.0, 3.5 * delta));
      controls.update();

      // Render
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
