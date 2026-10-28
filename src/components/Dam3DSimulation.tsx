/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { WATER_DENSITY, GRAVITY, MAX_WATER_HEIGHT } from '../types/dam.ts';

interface Dam3DSimulationProps {
  waterHeightM: number;
  cameraPreset: 'perspective' | 'cross_section' | 'water_face';
  isActive: boolean;
}

const DAM_HEIGHT_3D = 2.6;
const DAM_WIDTH_3D = 4.6;
const ARROW_COUNT = 8;

export const Dam3DSimulation: React.FC<Dam3DSimulationProps> = ({
  waterHeightM,
  cameraPreset,
  isActive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    waterHeightM,
    cameraPreset,
    isActive,
    currentWaterY: 1.2,
    targetWaterY: 1.2,
    cameraTargetPos: new THREE.Vector3(-6.8, 4.8, 6.8),
    cameraTargetLookAt: new THREE.Vector3(0.6, 1.25, 0),
  });

  // Calculate 3D water level Y from meters (0 to 50 m -> 0 to 2.45 units)
  const getWaterYFromMeters = (m: number) => {
    return (m / MAX_WATER_HEIGHT) * 2.45;
  };

  useEffect(() => {
    stateRef.current.waterHeightM = waterHeightM;
    stateRef.current.targetWaterY = getWaterYFromMeters(waterHeightM);
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.isActive = isActive;
  }, [waterHeightM, cameraPreset, isActive]);

  // Handle camera presets
  useEffect(() => {
    const s = stateRef.current;
    if (cameraPreset === 'perspective') {
      // Sudut pandang isometrik mundur: memperlihatkan struktur waduk, puncak jalan, dan kemiringan dasar bendungan
      s.cameraTargetPos.set(-6.8, 4.8, 6.8);
      s.cameraTargetLookAt.set(0.6, 1.25, 0);
    } else if (cameraPreset === 'cross_section') {
      // Tampilan penampang samping yang pas di tengah tanpa terpotong
      s.cameraTargetPos.set(0.7, 1.8, 9.2);
      s.cameraTargetLookAt.set(0.7, 1.25, 0);
    } else if (cameraPreset === 'water_face') {
      // Menghadap dinding hulu dari dalam waduk air
      s.cameraTargetPos.set(-7.2, 2.8, 0);
      s.cameraTargetLookAt.set(-0.3, 1.25, 0);
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
    scene.background = new THREE.Color(0x0c121c);
    scene.fog = new THREE.FogExp2(0x0c121c, 0.035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(-6.8, 4.8, 6.8);

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
    const sunLight = new THREE.DirectionalLight(0xfffaea, 2.8);
    sunLight.position.set(-5, 8, 4);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      const d = 5.0;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(4, 3, -3);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.0;
    controls.maxDistance = 18.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0.6, 1.25, 0);
    controls.update();

    // -------------------------------------------------------------
    // 1. TERRAIN & RIVERBED VALLEY
    // -------------------------------------------------------------
    const groundGeo = new THREE.BoxGeometry(10.0, 0.2, 8.0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e2736,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, rockMat);
    ground.position.set(0, -0.1, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // Valley canyon walls at both sides (Z = ±2.3)
    const canyonGeo = new THREE.BoxGeometry(6.0, 3.4, 1.4);
    const canyonLeft = new THREE.Mesh(canyonGeo, rockMat);
    canyonLeft.position.set(0, 1.6, -3.0);
    canyonLeft.castShadow = true;
    canyonLeft.receiveShadow = true;
    scene.add(canyonLeft);

    const canyonRight = new THREE.Mesh(canyonGeo, rockMat);
    canyonRight.position.set(0, 1.6, 3.0);
    canyonRight.castShadow = true;
    canyonRight.receiveShadow = true;
    scene.add(canyonRight);

    // -------------------------------------------------------------
    // 2. TRAPEZOIDAL DAM STRUCTURE (Thick Base, Slender Top)
    // -------------------------------------------------------------
    // Upstream face at X = -0.3 (vertical)
    // Crest at X = [-0.3, 0.3], Y = 2.6 (thickness = 0.6)
    // Base at X = [-0.3, 1.9], Y = 0 (thickness = 2.2 -> VERY THICK!)
    const damShape = new THREE.Shape();
    damShape.moveTo(-0.3, 0);
    damShape.lineTo(-0.3, DAM_HEIGHT_3D);
    damShape.lineTo(0.3, DAM_HEIGHT_3D);
    damShape.lineTo(1.9, 0);
    damShape.lineTo(-0.3, 0);

    const extrudeSettings = {
      depth: DAM_WIDTH_3D,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const damGeo = new THREE.ExtrudeGeometry(damShape, extrudeSettings);
    damGeo.translate(0, 0, -DAM_WIDTH_3D / 2);

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.75,
      metalness: 0.15,
    });
    const damMesh = new THREE.Mesh(damGeo, concreteMat);
    damMesh.castShadow = true;
    damMesh.receiveShadow = true;
    scene.add(damMesh);

    // Crest Roadway / Walkway on top
    const roadGeo = new THREE.BoxGeometry(0.56, 0.04, DAM_WIDTH_3D);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, DAM_HEIGHT_3D + 0.02, 0);
    scene.add(road);

    // Safety railings on crest
    const railMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.3 });
    const railGeo = new THREE.BoxGeometry(0.02, 0.12, DAM_WIDTH_3D);
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(-0.28, DAM_HEIGHT_3D + 0.08, 0);
    scene.add(rail1);
    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0.28, DAM_HEIGHT_3D + 0.08, 0);
    scene.add(rail2);

    // -------------------------------------------------------------
    // 3. WATER RESERVOIR (Dynamic Volume & Top Surface)
    // -------------------------------------------------------------
    const waterWidth = 3.2; // in -X direction
    const waterContainer = new THREE.Group();
    waterContainer.position.set(-0.3 - waterWidth / 2, 0, 0);
    scene.add(waterContainer);

    // Water Body Box (scaled in tick loop)
    const waterBodyGeo = new THREE.BoxGeometry(waterWidth, 1.0, DAM_WIDTH_3D);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.45 : 0.75,
      roughness: 0.15,
      metalness: 0.1,
      ior: 1.33,
    });
    const waterBody = new THREE.Mesh(waterBodyGeo, waterMat);
    waterBody.position.set(0, 0.5, 0);
    waterContainer.add(waterBody);

    // Water Surface Plane (Gleaming reflection)
    const waterSurfaceGeo = new THREE.PlaneGeometry(waterWidth, DAM_WIDTH_3D);
    const waterSurfaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const waterSurface = new THREE.Mesh(waterSurfaceGeo, waterSurfaceMat);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(0, 1.0, 0);
    waterContainer.add(waterSurface);

    // -------------------------------------------------------------
    // 4. HYDROSTATIC PRESSURE VECTORS (Triangle of Force Arrows)
    // -------------------------------------------------------------
    // Placed along the upstream wall at X = -0.3
    // Pushing into the wall (+X direction)
    const arrowGroup = new THREE.Group();
    arrowGroup.position.set(-0.3, 0, 0);
    scene.add(arrowGroup);

    interface ArrowItem {
      container: THREE.Group;
      shaft: THREE.Mesh;
      cone: THREE.Mesh;
      yPos: number;
      mat: THREE.MeshStandardMaterial;
    }

    const arrows: ArrowItem[] = [];

    for (let i = 0; i < ARROW_COUNT; i++) {
      // Y positions distributed from bottom (0.15) to near top (2.35)
      const y = 0.18 + (i / (ARROW_COUNT - 1)) * 2.15;

      const aGroup = new THREE.Group();
      aGroup.position.set(0, y, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.25,
      });

      // Shaft lies along X (points towards +X dam face)
      const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.0, 16);
      shaftGeo.rotateZ(-Math.PI / 2);
      shaftGeo.translate(-0.5, 0, 0); // Tail at -1.0, head near 0
      const shaft = new THREE.Mesh(shaftGeo, mat);
      aGroup.add(shaft);

      // Arrow cone head right at the dam face (X = 0)
      const coneGeo = new THREE.ConeGeometry(0.11, 0.22, 16);
      coneGeo.rotateZ(-Math.PI / 2); // points right (+X)
      coneGeo.translate(-0.11, 0, 0);
      const cone = new THREE.Mesh(coneGeo, mat);
      aGroup.add(cone);

      arrowGroup.add(aGroup);
      arrows.push({ container: aGroup, shaft, cone, yPos: y, mat });
    }

    // -------------------------------------------------------------
    // ANIMATION LOOP
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

      // Smooth water height transition
      s.currentWaterY += (s.targetWaterY - s.currentWaterY) * Math.min(1.0, 4.0 * delta);

      // Update water body scale and surface plane
      const wY = Math.max(0.05, s.currentWaterY);
      waterBody.scale.y = wY;
      waterBody.position.y = wY / 2;
      waterSurface.position.y = wY;

      // Update Hydrostatic Pressure Vectors along the wall
      // Pressure P(y) = rho * g * depth = rho * g * (wY - y)
      // Max possible depth is wY (at y = 0)
      const maxArrowLength = 1.85;

      for (let i = 0; i < ARROW_COUNT; i++) {
        const a = arrows[i];
        const depthIn3D = s.currentWaterY - a.yPos;

        if (depthIn3D <= 0) {
          // Above water level: zero hydrostatic pressure!
          a.container.visible = false;
        } else {
          a.container.visible = true;

          // Arrow length proportional to depth
          const depthRatio = depthIn3D / 2.45; // 0 to 1
          const length = Math.max(0.12, depthRatio * maxArrowLength);

          a.shaft.scale.set(length, 1, 1);
          a.shaft.position.x = 0;

          // Color: Green near surface -> Amber -> Red at deepest bottom!
          const normDepth = Math.min(1.0, Math.max(0, depthRatio * 1.1));
          const arrowColor = new THREE.Color().setHSL(0.33 * (1 - normDepth), 0.95, 0.5);
          a.mat.color.copy(arrowColor);
          a.mat.emissive.copy(arrowColor);
        }
      }

      // Camera lerp
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
