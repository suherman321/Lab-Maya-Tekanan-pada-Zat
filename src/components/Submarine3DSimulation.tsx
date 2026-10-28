/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createContactShadowTexture } from '../utils/proceduralTextures.ts';
import { soundManager } from '../utils/soundEffects.ts';

interface Submarine3DSimulationProps {
  ballastPercent: number;
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'side' | 'closeup';
  isActive: boolean;
}

const TANK_WIDTH = 6.2;
const TANK_HEIGHT = 2.6;
const TANK_DEPTH = 3.6;
const WATER_SURFACE_Y = 2.15;
const SEABED_Y = 0.05;

// Vertical submarine depth positions
const Y_SURFACE = 2.02; // Floating
const Y_NEUTRAL = 1.15; // Hovering in mid-water
const Y_SEABED = 0.32;  // Resting on floor

const BUBBLE_COUNT = 140;

export const Submarine3DSimulation: React.FC<Submarine3DSimulationProps> = ({
  ballastPercent,
  soundEnabled,
  cameraPreset,
  isActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    ballastPercent,
    soundEnabled,
    cameraPreset,
    isActive,
    subY: Y_SURFACE,
    targetSubY: Y_SURFACE,
    prevBallast: ballastPercent,
    blowingBubbles: false,
    cameraTargetPos: new THREE.Vector3(0, 2.0, 5.2),
    cameraTargetLookAt: new THREE.Vector3(0, 1.1, 0),
  });

  // Calculate target Y based on ballast %
  const getSubmarineTargetY = (percent: number) => {
    // 0% -> Y_SURFACE, 50% -> Y_NEUTRAL, 100% -> Y_SEABED
    if (percent <= 50) {
      const frac = percent / 50;
      return Y_SURFACE - frac * (Y_SURFACE - Y_NEUTRAL);
    } else {
      const frac = (percent - 50) / 50;
      return Y_NEUTRAL - frac * (Y_NEUTRAL - Y_SEABED);
    }
  };

  useEffect(() => {
    const s = stateRef.current;
    s.targetSubY = getSubmarineTargetY(ballastPercent);

    // If ballast decreases, trigger air bubble blow effect!
    if (ballastPercent < s.prevBallast) {
      s.blowingBubbles = true;
      if (soundEnabled) {
        soundManager.playUnderwaterBubbles();
      }
    }
    s.prevBallast = ballastPercent;
    s.ballastPercent = ballastPercent;
    s.soundEnabled = soundEnabled;
    s.cameraPreset = cameraPreset;
    s.isActive = isActive;
  }, [ballastPercent, soundEnabled, cameraPreset, isActive]);

  // Handle camera presets
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'perspective') {
      s.cameraTargetPos.set(0, 2.2, 5.2);
      s.cameraTargetLookAt.set(0, 1.1, 0);
    } else if (cameraPreset === 'side') {
      s.cameraTargetPos.set(0, 1.2, 4.8);
      s.cameraTargetLookAt.set(0, 1.1, 0);
    } else if (cameraPreset === 'closeup') {
      s.cameraTargetPos.set(0, 1.4, 3.0);
      s.cameraTargetLookAt.set(0, s.subY, 0);
    }
  }, [cameraPreset]);

  // Resume loop on active
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
    scene.background = new THREE.Color(0x060c14);
    scene.fog = new THREE.FogExp2(0x060c14, 0.035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);

    // Renderer
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

    // Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting
    // Overhead ocean sunlight
    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 2.8);
    sunLight.position.set(2, 7, 3);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      const d = 4.0;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
    }
    scene.add(sunLight);

    const oceanHemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0c1e33, 1.1);
    scene.add(oceanHemiLight);

    const underwaterFill = new THREE.DirectionalLight(0x0284c7, 1.2);
    underwaterFill.position.set(-3, 1, -2);
    scene.add(underwaterFill);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 11.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 1.1, 0);
    controls.update();

    // -------------------------------------------------------------
    // 1. AQUATIC OCEAN TANK (Glass enclosure with blue water & sand)
    // -------------------------------------------------------------
    const tankGroup = new THREE.Group();

    // Tank Base Floor (Sandy Seabed)
    const sandGeo = new THREE.BoxGeometry(TANK_WIDTH, 0.15, TANK_DEPTH);
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xc2a677,
      roughness: 0.9,
      metalness: 0.05,
    });
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.position.set(0, SEABED_Y - 0.075, 0);
    sandMesh.receiveShadow = true;
    tankGroup.add(sandMesh);

    // Decorative seabed rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const rockOffsets = [
      { x: -2.2, z: -1.1, r: 0.22 },
      { x: -1.8, z: 1.2, r: 0.18 },
      { x: 2.1, z: -0.9, r: 0.25 },
      { x: 1.6, z: 1.1, r: 0.16 },
    ];
    rockOffsets.forEach((rk) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rk.r), rockMat);
      rock.position.set(rk.x, SEABED_Y + rk.r * 0.7, rk.z);
      rock.receiveShadow = true;
      rock.castShadow = true;
      tankGroup.add(rock);
    });

    // Glass Tank Walls
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.85,
      roughness: 0.06,
      metalness: 0.08,
      ior: 1.5,
    });
    const tankWallGeo = new THREE.BoxGeometry(TANK_WIDTH + 0.04, TANK_HEIGHT, TANK_DEPTH + 0.04);
    const tankGlass = new THREE.Mesh(tankWallGeo, glassMat);
    tankGlass.position.set(0, TANK_HEIGHT / 2, 0);
    tankGroup.add(tankGlass);

    // Blue Oceanic Water Body
    const waterGeo = new THREE.BoxGeometry(TANK_WIDTH, WATER_SURFACE_Y - SEABED_Y, TANK_DEPTH);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.45 : 0.72,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.33,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, SEABED_Y + (WATER_SURFACE_Y - SEABED_Y) / 2, 0);
    tankGroup.add(waterMesh);

    // Water Surface Glimmer Plane
    const surfaceGeo = new THREE.PlaneGeometry(TANK_WIDTH, TANK_DEPTH);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.15,
      metalness: 0.2,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.set(0, WATER_SURFACE_Y, 0);
    tankGroup.add(surfaceMesh);

    // Tank metallic corner framing columns
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const cornerOffsets = [
      { x: -TANK_WIDTH / 2, z: -TANK_DEPTH / 2 },
      { x: TANK_WIDTH / 2, z: -TANK_DEPTH / 2 },
      { x: -TANK_WIDTH / 2, z: TANK_DEPTH / 2 },
      { x: TANK_WIDTH / 2, z: TANK_DEPTH / 2 },
    ];
    cornerOffsets.forEach((pos) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, TANK_HEIGHT + 0.1, 0.12), frameMat);
      post.position.set(pos.x, TANK_HEIGHT / 2, pos.z);
      tankGroup.add(post);
    });

    scene.add(tankGroup);

    // Soft seabed contact shadow
    const subShadowTex = createContactShadowTexture();
    const subShadowMat = new THREE.MeshBasicMaterial({
      map: subShadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const subShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), subShadowMat);
    subShadow.rotation.x = -Math.PI / 2;
    subShadow.position.set(0, SEABED_Y + 0.005, 0);
    scene.add(subShadow);

    // -------------------------------------------------------------
    // 2. PROCEDURAL 3D SUBMARINE MODEL (`THREE.Group`)
    // -------------------------------------------------------------
    const subGroup = new THREE.Group();
    subGroup.position.set(0, Y_SURFACE, 0);

    const subHullMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Navy deep steel
      metalness: 0.85,
      roughness: 0.28,
    });
    const subAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber yellow hazard stripe
      metalness: 0.4,
      roughness: 0.35,
    });
    const glassPortholeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.2,
    });

    // A. Main Torpedo Hull Body (Length = 2.8, Radius = 0.38)
    const hullCylGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.8, 32);
    hullCylGeo.rotateZ(Math.PI / 2);
    const hullCyl = new THREE.Mesh(hullCylGeo, subHullMat);
    hullCyl.castShadow = true;
    subGroup.add(hullCyl);

    // Front Hemispherical Bow Nose Cone
    const noseGeo = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    noseGeo.rotateZ(-Math.PI / 2);
    noseGeo.translate(0.9, 0, 0);
    const nose = new THREE.Mesh(noseGeo, subHullMat);
    nose.castShadow = true;
    subGroup.add(nose);

    // Tapered Stern Tail Cone
    const tailGeo = new THREE.ConeGeometry(0.38, 0.6, 32);
    tailGeo.rotateZ(Math.PI / 2);
    tailGeo.translate(-1.2, 0, 0);
    const tail = new THREE.Mesh(tailGeo, subHullMat);
    tail.castShadow = true;
    subGroup.add(tail);

    // B. Conning Tower (Sail) on Top
    const towerGeo = new THREE.BoxGeometry(0.55, 0.45, 0.22);
    const tower = new THREE.Mesh(towerGeo, subHullMat);
    tower.position.set(0.1, 0.52, 0);
    tower.castShadow = true;
    subGroup.add(tower);

    // Periscope and Antenna Mast
    const periGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 16);
    const periscope = new THREE.Mesh(periGeo, subHullMat);
    periscope.position.set(0.15, 0.85, 0);
    subGroup.add(periscope);

    const periHead = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.05), subAccentMat);
    periHead.position.set(0.15, 1.05, 0);
    subGroup.add(periHead);

    // C. Horizontal Dive Hydroplanes
    const planeGeo = new THREE.BoxGeometry(0.3, 0.03, 1.25);
    const divePlanes = new THREE.Mesh(planeGeo, subHullMat);
    divePlanes.position.set(0.1, 0.52, 0);
    subGroup.add(divePlanes);

    // Bow small dive planes
    const bowPlaneGeo = new THREE.BoxGeometry(0.2, 0.025, 0.95);
    const bowPlanes = new THREE.Mesh(bowPlaneGeo, subHullMat);
    bowPlanes.position.set(0.85, 0.05, 0);
    subGroup.add(bowPlanes);

    // D. Tail Cruciform Fins (Rudders)
    const finVertGeo = new THREE.BoxGeometry(0.35, 0.75, 0.03);
    const finVert = new THREE.Mesh(finVertGeo, subHullMat);
    finVert.position.set(-1.35, 0, 0);
    subGroup.add(finVert);

    const finHorizGeo = new THREE.BoxGeometry(0.35, 0.03, 0.75);
    const finHoriz = new THREE.Mesh(finHorizGeo, subHullMat);
    finHoriz.position.set(-1.35, 0, 0);
    subGroup.add(finHoriz);

    // E. Spinning Brass Propeller
    const propGroup = new THREE.Group();
    propGroup.position.set(-1.52, 0, 0);

    const propHub = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 16), brassMat);
    propHub.rotateZ(Math.PI / 2);
    propGroup.add(propHub);

    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.28, 0.08), brassMat);
      blade.rotation.x = (b * Math.PI) / 2 + 0.3;
      blade.position.set(-0.02, 0, 0);
      propGroup.add(blade);
    }
    subGroup.add(propGroup);

    // F. Hull Accent Stripes & Glowing Portholes
    const stripeGeo = new THREE.TorusGeometry(0.382, 0.015, 12, 32);
    stripeGeo.rotateY(Math.PI / 2);
    const stripe1 = new THREE.Mesh(stripeGeo, subAccentMat);
    stripe1.position.set(0.65, 0, 0);
    subGroup.add(stripe1);

    const stripe2 = new THREE.Mesh(stripeGeo, subAccentMat);
    stripe2.position.set(-0.65, 0, 0);
    subGroup.add(stripe2);

    // Porthole circular windows
    for (let w = -2; w <= 2; w++) {
      if (w === 0) continue;
      const port = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), glassPortholeMat);
      port.position.set(w * 0.32, 0.12, 0.382);
      subGroup.add(port);

      const portOther = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), glassPortholeMat);
      portOther.rotation.y = Math.PI;
      portOther.position.set(w * 0.32, 0.12, -0.382);
      subGroup.add(portOther);
    }

    // G. Cutaway Ballast Tank Level Indicator Tube on Hull
    const tankTubeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.9, 16);
    tankTubeGeo.rotateZ(Math.PI / 2);
    const tankGlassTube = new THREE.Mesh(tankTubeGeo, glassMat);
    tankGlassTube.position.set(0, -0.15, 0.385);
    subGroup.add(tankGlassTube);

    // Internal water level in ballast tube
    const ballastWaterGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.9, 16);
    ballastWaterGeo.rotateZ(Math.PI / 2);
    const ballastWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const ballastWaterMesh = new THREE.Mesh(ballastWaterGeo, ballastWaterMat);
    ballastWaterMesh.position.set(0, -0.15, 0.385);
    subGroup.add(ballastWaterMesh);

    scene.add(subGroup);

    // -------------------------------------------------------------
    // 3. AIR BUBBLE PARTICLE SYSTEM (`InstancedMesh`)
    // -------------------------------------------------------------
    const bubbleGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.3 : 0.7,
      roughness: 0.1,
      ior: 1.1,
    });
    const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, BUBBLE_COUNT);
    bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(bubbles);

    const bPos: THREE.Vector3[] = [];
    const bVel: THREE.Vector3[] = [];
    const bActive: boolean[] = [];

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bPos.push(new THREE.Vector3(0, -10, 0));
      bVel.push(new THREE.Vector3());
      bActive.push(false);
    }

    const triggerBubbles = () => {
      for (let i = 0; i < 25; i++) {
        const idx = Math.floor(Math.random() * BUBBLE_COUNT);
        bActive[idx] = true;
        // Emitter at submarine ballast exhaust ports
        bPos[idx].set(
          subGroup.position.x + (Math.random() - 0.5) * 1.4,
          subGroup.position.y - 0.15 + (Math.random() - 0.5) * 0.1,
          subGroup.position.z + (Math.random() > 0.5 ? 0.4 : -0.4)
        );
        bVel[idx].set(
          (Math.random() - 0.5) * 0.3,
          0.8 + Math.random() * 1.2, // Upward buoyant bubble velocity
          (Math.random() - 0.5) * 0.3
        );
      }
    };

    // -------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameId = 0;
    const dummy = new THREE.Object3D();

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
      const time = clock.getElapsedTime();
      const s = stateRef.current;

      // 1. Smooth Vertical Submarine Motion (Archimedes Kinematics)
      s.subY += (s.targetSubY - s.subY) * Math.min(1.0, 2.2 * delta);

      // Subtle natural floating sway (greater when floating at surface)
      const isFloating = s.ballastPercent < 45;
      const isNeutral = s.ballastPercent >= 45 && s.ballastPercent <= 55;
      const swayAmp = isFloating ? 0.03 : isNeutral ? 0.015 : 0.002;
      const swayY = Math.sin(time * 1.8) * swayAmp;
      const pitchZ = Math.sin(time * 1.2) * (swayAmp * 0.8);

      subGroup.position.y = s.subY + swayY;
      subGroup.rotation.z = pitchZ;

      // Update Submarine Shadow on Seabed (fades when high, dark when touching)
      const floorDist = Math.max(0, s.subY - SEABED_Y);
      subShadowMat.opacity = Math.max(0.1, 0.7 - floorDist * 0.3);
      const shadowScale = Math.min(1.4, 0.8 + floorDist * 0.25);
      subShadow.scale.set(shadowScale, shadowScale, 1);

      // 2. Spin Propeller
      propGroup.rotation.x += 12 * delta;

      // 3. Update Ballast Visual Tube (scale along X: 0% empty -> 100% full)
      const fillFrac = Math.max(0.02, s.ballastPercent / 100);
      ballastWaterMesh.scale.set(fillFrac, 1, 1);
      ballastWaterMesh.position.x = -0.45 * (1 - fillFrac);

      // 4. Trigger air bubbles when blowing ballast tanks
      if (s.blowingBubbles) {
        triggerBubbles();
        s.blowingBubbles = false;
      }

      // Update Bubbles physics
      let anyBubbleActive = false;
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        if (!bActive[i]) continue;

        bPos[i].y += bVel[i].y * delta;
        bPos[i].x += Math.sin(time * 5 + i) * 0.015;
        bPos[i].z += Math.cos(time * 5 + i) * 0.015;

        // Pop when reaching water surface
        if (bPos[i].y >= WATER_SURFACE_Y - 0.02) {
          bActive[i] = false;
          bPos[i].set(0, -10, 0);
        } else {
          anyBubbleActive = true;
        }

        dummy.position.copy(bPos[i]);
        dummy.updateMatrix();
        bubbles.setMatrixAt(i, dummy.matrix);
      }
      if (anyBubbleActive) {
        bubbles.instanceMatrix.needsUpdate = true;
      }

      // 5. Camera Interpolation
      camera.position.lerp(s.cameraTargetPos, Math.min(1.0, 3.5 * delta));
      controls.target.lerp(s.cameraTargetLookAt, Math.min(1.0, 3.5 * delta));
      controls.update();

      // Render
      renderer.render(scene, camera);

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
