/**
 * HeroBackground — Canvas-based dynamic background for the hero section.
 *
 * Four animation modes for review:
 *   A: "particle-river"  — Particles flow horizontally in streams, simulating data flowing between edge nodes
 *   B: "aurora-wave"     — Large flowing gradient waves that undulate, like computing energy pulsing
 *   C: "circuit-pulse"   — Glowing dots travel along circuit-like paths, data packets in transit
 *   D: "world-network"   — Dot-matrix world map with global edge node connections and flowing particles
 *
 * Set the `mode` prop to switch between them.
 */
import React, { useRef, useEffect, useCallback } from 'react';

type AnimMode = 'particle-river' | 'aurora-wave' | 'circuit-pulse' | 'world-network';

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

/* ── Mode D: World Network ──────────────────────────── */

// Simplified world outline: [lon, lat] pairs; [NaN, NaN] = pen lift
const WORLD_OUTLINE: [number, number][] = [
  // North America
  [-168,71],[-152,71],[-140,60],[-136,57],[-130,54],[-127,50],
  [-124,47],[-124,38],[-117,32],[-110,23],[-99,19],[-90,15],
  [-83,10],[-77,8],[-77,9],[-80,9],[-84,9],[-90,14],[-92,16],
  [-97,22],[-97,26],[-96,30],[-90,29],[-85,29],[-82,25],
  [-81,25],[-80,27],[-80,31],[-75,35],[-76,37],[-75,40],
  [-74,41],[-71,42],[-70,43],[-67,44],[-64,45],[-60,46],
  [-64,47],[-70,47],[-74,45],[-79,43],[-82,43],[-83,45],
  [-85,46],[-84,47],[-82,45],[-80,44],[-78,44],[-76,44],
  [-75,45],[-73,45],[-70,47],[-65,44],[-64,45],[-64,47],
  [-70,53],[-76,55],[-80,60],[-83,63],[-85,66],[-88,70],
  [-96,73],[-107,73],[-120,70],[-132,71],[-140,71],[-152,71],[-168,71],
  [NaN,NaN],
  // South America
  [-77,8],[-79,5],[-80,0],[-80,-4],[-81,-6],[-80,-9],
  [-76,-14],[-71,-18],[-70,-22],[-69,-26],[-70,-30],
  [-71,-34],[-72,-38],[-72,-43],[-72,-48],[-68,-54],[-68,-56],
  [-66,-55],[-63,-53],[-58,-51],[-54,-48],[-50,-44],
  [-49,-28],[-48,-24],[-44,-22],[-40,-19],[-36,-10],
  [-35,-8],[-35,-5],[-37,-3],[-38,-2],[-44,-2],
  [-52,-2],[-60,0],[-66,2],[-73,5],[-77,8],
  [NaN,NaN],
  // Europe (mainland)
  [-9,36],[-9,39],[-9,43],[-4,44],[3,44],[5,43],
  [8,44],[10,44],[13,45],[14,46],[16,47],[17,48],
  [19,49],[16,54],[18,55],[20,56],[24,58],[25,60],
  [24,62],[22,63],[20,63],[14,57],[10,56],[8,55],
  [8,57],[5,57],[5,55],[2,54],[1,52],[1,51],
  [-1,50],[-2,51],[-4,50],[-5,48],[-2,47],[0,47],
  [3,44],[5,43],[3,43],[0,43],[-2,43],[-4,44],
  [-8,44],[-8,42],[-6,41],[-8,38],[-8,37],[-6,37],
  [-5,36],[-3,36],[0,36],[3,37],[4,38],[3,41],[0,41],
  [-2,42],[0,43],
  [NaN,NaN],
  // Scandinavia
  [24,60],[26,60],[28,65],[27,71],[25,71],[22,71],
  [18,70],[15,68],[14,65],[14,57],[16,56],[18,57],
  [20,57],[18,55],[16,56],[14,57],
  [NaN,NaN],
  // UK
  [-6,50],[-5,51],[-4,52],[-3,53],[-3,55],[-4,57],
  [-3,58],[-2,59],[0,59],[0,58],[2,57],[1,52],
  [-1,51],[-2,51],[-4,50],[-6,50],
  [NaN,NaN],
  // Africa
  [-6,36],[-4,35],[-2,35],[1,37],[5,37],[10,37],
  [13,37],[16,33],[23,32],[29,31],[33,31],[35,30],
  [38,23],[40,15],[42,12],[44,12],[47,11],[50,13],
  [44,12],[38,11],[36,4],[34,-3],[36,-8],
  [37,-14],[36,-20],[35,-25],[33,-29],[29,-30],
  [28,-34],[26,-34],[18,-35],[16,-34],[15,-28],
  [12,-18],[11,-6],[9,2],[8,4],[2,5],
  [-2,5],[-6,5],[-8,5],[-14,10],[-16,13],
  [-17,15],[-17,21],[-16,21],[-14,23],
  [-14,28],[-12,30],[-8,31],[-6,33],[-6,36],
  [NaN,NaN],
  // Arabia & Middle East
  [36,36],[38,24],[40,20],[43,17],[44,13],
  [47,13],[50,16],[52,17],[55,22],[56,24],
  [55,23],[53,24],[50,27],[50,30],[48,30],
  [46,30],[45,30],[44,32],[46,34],[48,32],[50,30],
  [NaN,NaN],
  // Indian Subcontinent
  [68,24],[66,24],[64,26],[62,24],[62,22],
  [64,22],[66,24],[68,22],[68,20],[70,18],
  [72,16],[73,15],[76,12],[78,10],[80,8],
  [80,10],[78,12],[77,14],[76,18],[73,21],
  [72,22],[68,22],[68,24],[74,24],[76,28],
  [80,32],[84,32],[88,26],[88,22],[92,22],
  [96,24],[98,28],[98,22],
  [NaN,NaN],
  // SE Asia
  [98,22],[100,18],[100,14],[101,12],[103,1],
  [104,1],[103,3],[103,6],[102,8],[100,10],
  [99,13],[98,14],[97,17],[96,20],[97,22],
  [103,1],[104,6],[104,10],[107,16],
  [108,18],[106,20],[105,22],[106,24],[108,21],
  [NaN,NaN],
  // China & Korea
  [108,21],[110,20],[112,22],[114,23],[116,24],
  [118,26],[120,26],[122,30],[122,32],[120,33],
  [119,36],[120,38],[122,40],[122,42],[124,42],
  [126,38],[128,35],[130,34],[131,33],[130,32],
  [128,35],[126,37],[124,39],[122,42],
  [NaN,NaN],
  // Japan
  [132,34],[133,35],[135,35],[136,37],[137,38],
  [137,40],[141,41],[142,43],[142,45],[144,44],
  [143,43],[141,40],[140,38],[141,36],[141,35],
  [138,34],[136,34],[135,34],[133,34],[132,34],
  [NaN,NaN],
  // Siberia & Far East Russia
  [140,46],[142,48],[142,52],[141,55],[140,58],
  [142,60],[143,62],[150,62],[160,62],[168,64],
  [170,64],[170,66],[165,66],[160,64],[157,62],
  [155,60],[158,58],[160,54],[156,52],[150,46],[140,46],
  [NaN,NaN],
  // Russia Arctic coast
  [30,70],[35,71],[40,72],[50,73],[60,75],
  [70,73],[80,73],[90,73],[100,73],[110,72],
  [120,70],[130,68],[140,68],[155,68],[165,68],[170,66],
  [NaN,NaN],
  // Australia
  [114,-24],[113,-22],[114,-20],[116,-18],[118,-16],
  [122,-16],[128,-14],[132,-12],[136,-12],[138,-14],
  [142,-14],[146,-18],[148,-20],[152,-24],[154,-28],
  [152,-32],[150,-36],[147,-38],[144,-38],[143,-38],
  [141,-38],[140,-36],[138,-36],[136,-35],[134,-34],
  [132,-34],[130,-35],[126,-34],[122,-34],[118,-32],
  [115,-30],[113,-26],[114,-24],
  [NaN,NaN],
  // Greenland
  [-20,83],[-30,83],[-40,82],[-48,79],[-52,76],
  [-55,73],[-58,70],[-60,66],[-58,64],[-56,62],
  [-54,62],[-52,64],[-48,68],[-44,70],[-42,72],
  [-40,76],[-35,78],[-30,80],[-25,82],[-20,83],
];

// Global edge computing hubs: [lon, lat, isGreen]
const EDGE_NODES_DATA: [number, number, boolean][] = [
  [-74, 41, true],    // New York
  [-118, 34, true],   // Los Angeles
  [-122, 48, false],  // Seattle
  [-87, 42, false],   // Chicago
  [-47, -24, true],   // São Paulo
  [-0.1, 51, false],  // London
  [9, 50, true],      // Frankfurt
  [2, 49, false],     // Paris
  [4, 52, false],     // Amsterdam
  [140, 36, true],    // Tokyo
  [104, 1, false],    // Singapore
  [72, 19, true],     // Mumbai
  [114, 22, false],   // Hong Kong
  [116, 40, true],    // Beijing
  [28, -26, false],   // Johannesburg
  [151, -34, true],   // Sydney
  [55, 25, false],    // Dubai
  [37, 55, true],     // Moscow
];

interface WorldNode {
  x: number;
  y: number;
  phase: number;
  isGreen: boolean;
}

interface WorldParticle {
  fromIdx: number;
  toIdx: number;
  speed: number;
  offset: number;
  color: [number, number, number];
}

interface WorldNetworkState {
  mapCanvas: HTMLCanvasElement;
  nodes: WorldNode[];
  particles: WorldParticle[];
}

function latLonToXY(lon: number, lat: number, w: number, h: number): [number, number] {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
}

function buildMapCanvas(w: number, h: number, r: number): HTMLCanvasElement {
  const pw = Math.round(w * r);
  const ph = Math.round(h * r);
  const off = document.createElement('canvas');
  off.width = pw;
  off.height = ph;
  const ctx2 = off.getContext('2d')!;
  ctx2.fillStyle = 'rgba(34, 197, 94, 0.28)';

  let prev: [number, number] | null = null;
  for (const [lon, lat] of WORLD_OUTLINE) {
    if (isNaN(lon) || isNaN(lat)) {
      prev = null;
      continue;
    }
    const [x, y] = latLonToXY(lon, lat, pw, ph);
    if (prev) {
      const dx = x - prev[0];
      const dy = y - prev[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 4));
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const px = prev[0] + dx * frac;
        const py = prev[1] + dy * frac;
        ctx2.beginPath();
        ctx2.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx2.fill();
      }
    }
    prev = [x, y];
  }
  return off;
}

function initWorldNetwork(w: number, h: number, r: number): WorldNetworkState {
  const mapCanvas = buildMapCanvas(w, h, r);
  const nodes: WorldNode[] = EDGE_NODES_DATA.map(([lon, lat, isGreen]) => {
    const [x, y] = latLonToXY(lon, lat, w, h);
    return { x, y, phase: Math.random() * Math.PI * 2, isGreen };
  });

  const particles: WorldParticle[] = [];
  for (let i = 0; i < 22; i++) {
    const fromIdx = Math.floor(Math.random() * nodes.length);
    let toIdx = Math.floor(Math.random() * nodes.length);
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * nodes.length);
    const isGreen = Math.random() > 0.45;
    particles.push({
      fromIdx,
      toIdx,
      speed: 0.00018 + Math.random() * 0.00022,
      offset: Math.random(),
      color: isGreen ? [34, 197, 94] : [0, 102, 224],
    });
  }
  return { mapCanvas, nodes, particles };
}

function drawWorldNetwork(
  ctx: CanvasRenderingContext2D,
  state: WorldNetworkState,
  w: number,
  h: number,
  r: number,
  t: number,
) {
  // Draw static dot-matrix map (physical pixel space)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(state.mapCanvas, 0, 0);
  ctx.restore();

  const { nodes, particles } = state;

  // Faint arc paths for active connections
  for (const p of particles) {
    const from = nodes[p.fromIdx];
    const to = nodes[p.toIdx];
    const [pr, pg, pb] = p.color;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const cpY = midY - dist * 0.28;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.07)`;
    ctx.lineWidth = 0.8;
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(midX, cpY, to.x, to.y);
    ctx.stroke();
  }

  // Flowing particles along arcs
  for (const p of particles) {
    const progress = ((t * p.speed + p.offset) % 1 + 1) % 1;
    const from = nodes[p.fromIdx];
    const to = nodes[p.toIdx];
    const [pr, pg, pb] = p.color;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const cpY = midY - dist * 0.28;

    const inv = 1 - progress;
    const px = inv * inv * from.x + 2 * inv * progress * midX + progress * progress * to.x;
    const py = inv * inv * from.y + 2 * inv * progress * cpY + progress * progress * to.y;

    const fadeEdge = Math.min(progress * 8, 1) * Math.min((1 - progress) * 8, 1);

    const grd = ctx.createRadialGradient(px, py, 0, px, py, 14);
    grd.addColorStop(0, `rgba(${pr},${pg},${pb},${0.5 * fadeEdge})`);
    grd.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(${pr},${pg},${pb},${0.9 * fadeEdge})`;
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge nodes with pulsing rings
  for (const node of nodes) {
    const pulseFactor = Math.sin(t * 0.0008 + node.phase) * 0.5 + 0.5;
    const [nr, ng, nb] = node.isGreen ? [34, 197, 94] : [0, 140, 255];

    const ringR = 7 + pulseFactor * 10;
    const ringA = (1 - pulseFactor) * 0.35;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${nr},${ng},${nb},${ringA})`;
    ctx.lineWidth = 1;
    ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    const haloGrd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8);
    haloGrd.addColorStop(0, `rgba(${nr},${ng},${nb},0.6)`);
    haloGrd.addColorStop(1, `rgba(${nr},${ng},${nb},0)`);
    ctx.fillStyle = haloGrd;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Suppress unused-variable warning for r
  void r;
}

/* ── Main Component ─────────────────────────────────── */

export default function HeroBackground({ mode = 'particle-river', className }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    particles?: Particle[];
    circuitPaths?: CircuitPath[];
    worldNetwork?: WorldNetworkState;
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
    } else if (mode === 'world-network') {
      if (!stateRef.current.worldNetwork) {
        stateRef.current.worldNetwork = initWorldNetwork(w, h, r);
      }
      drawWorldNetwork(ctx, stateRef.current.worldNetwork, w, h, r, t);
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
      stateRef.current.worldNetwork = undefined;
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
