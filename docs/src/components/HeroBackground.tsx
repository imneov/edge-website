/**
 * HeroBackground — Canvas-based dynamic background for the hero section.
 *
 * Three animation modes for review:
 *   A: "particle-river"  — Particles flow horizontally in streams, simulating data flowing between edge nodes
 *   B: "aurora-wave"     — Large flowing gradient waves that undulate, like computing energy pulsing
 *   C: "circuit-pulse"   — Glowing dots travel along circuit-like paths, data packets in transit
 *
 * Set the `mode` prop to switch between them.
 */
import React, { useRef, useEffect, useCallback } from 'react';

type AnimMode = 'particle-river' | 'aurora-wave' | 'circuit-pulse';

interface HeroBackgroundProps {
  mode?: AnimMode;
  className?: string;
}

/* ── Shared helpers ─────────────────────────────────── */

function dpr() {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

function resize(canvas: HTMLCanvasElement) {
  const r = dpr();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w * r || canvas.height !== h * r) {
    canvas.width = w * r;
    canvas.height = h * r;
  }
  return { w, h, r };
}

/* ── Mode A: Particle River ─────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  stream: number; // which horizontal stream lane
  color: [number, number, number]; // RGB
}

function initParticleRiver(w: number, h: number): Particle[] {
  const count = Math.min(Math.floor(w * h / 4000), 280);
  const streams = 6;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const stream = Math.floor(Math.random() * streams);
    const baseY = (h / (streams + 1)) * (stream + 1);
    const isGreen = Math.random() > 0.45;
    particles.push({
      x: Math.random() * w,
      y: baseY + (Math.random() - 0.5) * (h / streams) * 0.6,
      vx: 0.3 + Math.random() * 0.8,
      vy: (Math.random() - 0.5) * 0.15,
      size: 1 + Math.random() * 2,
      life: Math.random() * 200,
      maxLife: 200 + Math.random() * 300,
      stream,
      color: isGreen ? [34, 197, 94] : [0, 102, 224],
    });
  }
  return particles;
}

function drawParticleRiver(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  _t: number,
) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy + Math.sin(p.x * 0.003 + p.stream) * 0.12;
    p.life++;

    if (p.x > w + 20 || p.life > p.maxLife) {
      const streams = 6;
      p.x = -10;
      p.stream = Math.floor(Math.random() * streams);
      const baseY = (h / (streams + 1)) * (p.stream + 1);
      p.y = baseY + (Math.random() - 0.5) * (h / streams) * 0.6;
      p.vx = 0.3 + Math.random() * 0.8;
      p.life = 0;
      p.maxLife = 200 + Math.random() * 300;
      const isGreen = Math.random() > 0.45;
      p.color = isGreen ? [34, 197, 94] : [0, 102, 224];
    }

    // Fade in/out
    const fadeIn = Math.min(p.life / 40, 1);
    const fadeOut = Math.max(1 - (p.life - p.maxLife + 60) / 60, 0);
    const alpha = Math.min(fadeIn, fadeOut) * 0.65;
    const [r, g, b] = p.color;

    // Glow
    ctx.beginPath();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw faint stream-lane connection lines
  ctx.strokeStyle = 'rgba(0, 102, 224, 0.04)';
  ctx.lineWidth = 1;
  const streams = 6;
  for (let s = 0; s < streams; s++) {
    const y = (h / (streams + 1)) * (s + 1);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/* ── Mode B: Aurora Wave ────────────────────────────── */

function drawAuroraWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const layers = [
    { color: [34, 197, 94], yOffset: 0.35, amplitude: 45, speed: 0.0004, alpha: 0.08, freq: 0.002 },
    { color: [0, 102, 224], yOffset: 0.5, amplitude: 55, speed: 0.0006, alpha: 0.1, freq: 0.0015 },
    { color: [34, 197, 94], yOffset: 0.65, amplitude: 40, speed: 0.0003, alpha: 0.06, freq: 0.0025 },
    { color: [0, 102, 224], yOffset: 0.4, amplitude: 50, speed: 0.0005, alpha: 0.07, freq: 0.0018 },
  ];

  for (const layer of layers) {
    ctx.beginPath();
    const baseY = h * layer.yOffset;
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const y =
        baseY +
        Math.sin(x * layer.freq + t * layer.speed) * layer.amplitude +
        Math.sin(x * layer.freq * 2.3 + t * layer.speed * 1.7) * layer.amplitude * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - layer.amplitude, 0, h);
    const [r, g, b] = layer.color;
    grad.addColorStop(0, `rgba(${r},${g},${b},${layer.alpha})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${layer.alpha * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Floating bright spots — simulate energy concentrations
  const spots = 5;
  for (let i = 0; i < spots; i++) {
    const sx = (w * (i + 0.5)) / spots + Math.sin(t * 0.0003 + i * 1.4) * 120;
    const sy = h * 0.42 + Math.cos(t * 0.0004 + i * 2.1) * 80;
    const isGreen = i % 2 === 0;
    const [r, g, b] = isGreen ? [34, 197, 94] : [0, 102, 224];
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 100);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.12)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, 100, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── Mode C: Circuit Pulse ──────────────────────────── */

interface CircuitPath {
  points: [number, number][];
  color: [number, number, number];
  speed: number;
  offset: number;
}

function buildCircuitPaths(w: number, h: number): CircuitPath[] {
  const paths: CircuitPath[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const isHorizontal = i < count / 2;
    const pts: [number, number][] = [];
    const segments = 4 + Math.floor(Math.random() * 3);

    if (isHorizontal) {
      let x = -50;
      const baseY = (h / (count / 2 + 1)) * (i + 1) + (Math.random() - 0.5) * 40;
      for (let s = 0; s <= segments; s++) {
        const dx = (w + 100) / segments;
        const y = baseY + (Math.random() - 0.5) * 80;
        pts.push([x, y]);
        x += dx;
      }
    } else {
      const j = i - count / 2;
      let y = -50;
      const baseX = (w / (count / 2 + 1)) * (j + 1) + (Math.random() - 0.5) * 40;
      for (let s = 0; s <= segments; s++) {
        const dy = (h + 100) / segments;
        const x = baseX + (Math.random() - 0.5) * 80;
        pts.push([x, y]);
        y += dy;
      }
    }

    const isGreen = Math.random() > 0.4;
    paths.push({
      points: pts,
      color: isGreen ? [34, 197, 94] : [0, 102, 224],
      speed: 0.0006 + Math.random() * 0.0008,
      offset: Math.random() * Math.PI * 2,
    });
  }
  return paths;
}

function drawCircuitPulse(
  ctx: CanvasRenderingContext2D,
  paths: CircuitPath[],
  w: number,
  h: number,
  t: number,
) {
  for (const path of paths) {
    const { points, color, speed, offset } = path;
    const [r, g, b] = color;

    // Draw the circuit path (faint)
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.06)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      const [px, py] = points[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Calculate total path length
    let totalLen = 0;
    const segLens: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i - 1][0];
      const dy = points[i][1] - points[i - 1][1];
      const len = Math.sqrt(dx * dx + dy * dy);
      segLens.push(len);
      totalLen += len;
    }

    // Flowing dot position
    const progress = ((t * speed + offset) % 1 + 1) % 1;
    const targetDist = progress * totalLen;
    let accumulated = 0;
    let dotX = points[0][0];
    let dotY = points[0][1];
    for (let i = 0; i < segLens.length; i++) {
      if (accumulated + segLens[i] >= targetDist) {
        const ratio = (targetDist - accumulated) / segLens[i];
        dotX = points[i][0] + (points[i + 1][0] - points[i][0]) * ratio;
        dotY = points[i][1] + (points[i + 1][1] - points[i][1]) * ratio;
        break;
      }
      accumulated += segLens[i];
    }

    // Glow around the traveling dot
    const grad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 30);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.5)`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
    ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    const trailLen = 0.08;
    const trailStart = ((progress - trailLen) % 1 + 1) % 1;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
    ctx.lineWidth = 2;
    const steps = 20;
    for (let s = 0; s <= steps; s++) {
      const p = (trailStart + (trailLen * s) / steps) % 1;
      const td = p * totalLen;
      let acc2 = 0;
      let tx = points[0][0];
      let ty = points[0][1];
      for (let i = 0; i < segLens.length; i++) {
        if (acc2 + segLens[i] >= td) {
          const ratio = (td - acc2) / segLens[i];
          tx = points[i][0] + (points[i + 1][0] - points[i][0]) * ratio;
          ty = points[i][1] + (points[i + 1][1] - points[i][1]) * ratio;
          break;
        }
        acc2 += segLens[i];
      }
      if (s === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // Junction nodes
    for (const [px, py] of points) {
      if (px < 0 || px > w || py < 0 || py > h) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},0.25)`;
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ── Main Component ─────────────────────────────────── */

export default function HeroBackground({ mode = 'particle-river', className }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles?: Particle[];
    circuitPaths?: CircuitPath[];
    raf?: number;
    startTime?: number;
  }>({});

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h, r } = resize(canvas);
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!stateRef.current.startTime) stateRef.current.startTime = performance.now();
    const t = performance.now() - stateRef.current.startTime;

    if (mode === 'particle-river') {
      if (!stateRef.current.particles) {
        stateRef.current.particles = initParticleRiver(w, h);
      }
      drawParticleRiver(ctx, stateRef.current.particles, w, h, t);
    } else if (mode === 'aurora-wave') {
      drawAuroraWave(ctx, w, h, t);
    } else if (mode === 'circuit-pulse') {
      if (!stateRef.current.circuitPaths) {
        stateRef.current.circuitPaths = buildCircuitPaths(w, h);
      }
      drawCircuitPulse(ctx, stateRef.current.circuitPaths, w, h, t);
    }

    stateRef.current.raf = requestAnimationFrame(animate);
  }, [mode]);

  useEffect(() => {
    // Reset state when mode changes
    stateRef.current = {};
    animate();
    return () => {
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
    };
  }, [animate]);

  // Handle resize — reinit particles/paths
  useEffect(() => {
    function onResize() {
      stateRef.current.particles = undefined;
      stateRef.current.circuitPaths = undefined;
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
