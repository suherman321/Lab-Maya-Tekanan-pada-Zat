/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Creates a procedural wood plank texture with authentic organic grain and growth rings.
 */
export function createWoodTexture(baseColorHex: string, grainColorHex: string): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const width = 1024;
  const height = 512;

  // 1. Color Map Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background base fill
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, width, height);

  // Parse colors for subtle blending
  const baseColor = new THREE.Color(baseColorHex);
  const grainColor = new THREE.Color(grainColorHex);

  // Generate longitudinal wood fibers and wavy ring lines
  const numRings = 70;
  for (let i = 0; i < numRings; i++) {
    const yCenter = (height * 0.4) + (Math.sin(i * 0.4) * 80);
    const alpha = 0.05 + Math.random() * 0.12;

    ctx.strokeStyle = `rgba(${Math.floor(grainColor.r * 255)}, ${Math.floor(grainColor.g * 255)}, ${Math.floor(grainColor.b * 255)}, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 1.5 + Math.random() * 3.5;

    ctx.beginPath();
    ctx.moveTo(0, yCenter + (i * 7) - 200);

    for (let x = 0; x <= width; x += 30) {
      const wave = Math.sin((x + i * 20) * 0.015) * 14 + Math.sin(x * 0.04) * 4;
      ctx.lineTo(x, yCenter + (i * 7) - 200 + wave);
    }
    ctx.stroke();
  }

  // Add subtle knots
  const knotPositions = [
    { x: width * 0.28, y: height * 0.45, r: 24 },
    { x: width * 0.76, y: height * 0.6, r: 18 },
  ];

  knotPositions.forEach((knot) => {
    const grad = ctx.createRadialGradient(knot.x, knot.y, 2, knot.x, knot.y, knot.r * 2);
    grad.addColorStop(0, `rgba(${Math.floor(grainColor.r * 180)}, ${Math.floor(grainColor.g * 180)}, ${Math.floor(grainColor.b * 180)}, 0.4)`);
    grad.addColorStop(0.5, `rgba(${Math.floor(grainColor.r * 220)}, ${Math.floor(grainColor.g * 220)}, ${Math.floor(grainColor.b * 220)}, 0.2)`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(knot.x, knot.y, knot.r * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fine fiber grain noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let p = 0; p < data.length; p += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[p] = Math.min(255, Math.max(0, data[p] + noise));
    data[p + 1] = Math.min(255, Math.max(0, data[p + 1] + noise));
    data[p + 2] = Math.min(255, Math.max(0, data[p + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const colorMap = new THREE.CanvasTexture(canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;

  // 2. Bump Map Canvas (Grayscale for surface depth)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 40; i++) {
    bCtx.strokeStyle = (i % 2 === 0) ? 'rgba(50, 50, 50, 0.15)' : 'rgba(200, 200, 200, 0.15)';
    bCtx.lineWidth = 1 + Math.random() * 3;
    bCtx.beginPath();
    bCtx.moveTo(0, i * 7);
    for (let x = 0; x <= 512; x += 20) {
      bCtx.lineTo(x, (i * 7) + Math.sin(x * 0.03) * 5);
    }
    bCtx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { colorMap, bumpMap };
}

/**
 * Creates a subtle studio workbench tabletop texture with beveled grid gridlines.
 */
export function createTableTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Neutral slate workbench color
  ctx.fillStyle = '#1c222c';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle laboratory grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Soft noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates a soft radial contact shadow texture for ground-plane grounding.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
  gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
