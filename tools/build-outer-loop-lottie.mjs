#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WIDTH = 800;
const HEIGHT = 800;
const FRAMES = 300;
const FPS = 30;
const CENTER = [400, 400];
const ROTATION = -18;
const DEG = Math.PI / 180;

const COLORS = {
  paper: [0.965, 0.949, 0.906, 1],
  paperDeep: [0.925, 0.894, 0.82, 1],
  ink: [0.09, 0.078, 0.051, 1],
  inkDim: [0.416, 0.384, 0.286, 1],
  blue: [0.141, 0.267, 0.494, 1],
  blueTint: [0.62, 0.7, 0.86, 1],
  red: [0.639, 0.141, 0.114, 1],
  green: [0.118, 0.42, 0.243, 1],
};

function staticTransform(position = CENTER, scale = [100, 100, 100], rotation = 0) {
  return {
    o: { a: 0, k: 100 },
    r: { a: 0, k: rotation },
    p: { a: 0, k: [...position, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: scale },
  };
}

function groupTransform(position = [0, 0], scale = [100, 100], rotation = 0) {
  return {
    ty: 'tr',
    p: { a: 0, k: position },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: scale },
    r: { a: 0, k: rotation },
    o: { a: 0, k: 100 },
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 },
    nm: 'Transform',
  };
}

function fill(color, opacity = 100) {
  return {
    ty: 'fl',
    c: { a: 0, k: color },
    o: { a: 0, k: opacity },
    r: 1,
    nm: 'Fill',
  };
}

function stroke(color, width, opacity = 100, dashed = false) {
  const value = {
    ty: 'st',
    c: { a: 0, k: color },
    o: { a: 0, k: opacity },
    w: { a: 0, k: width },
    lc: 2,
    lj: 2,
    ml: 4,
    nm: 'Stroke',
  };
  if (dashed) {
    value.d = [
      { n: 'd', nm: 'Dash', v: { a: 0, k: 9 } },
      { n: 'g', nm: 'Gap', v: { a: 0, k: 11 } },
      {
        n: 'o',
        nm: 'Offset',
        v: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [40], o: { x: [0.333], y: [0.333] }, i: { x: [0.667], y: [0.667] } },
            { t: FRAMES, s: [40] },
          ],
        },
      },
    ];
  }
  return value;
}

function ellipse(name, size, color, width, opacity, dashed = false) {
  return {
    ty: 'gr',
    nm: name,
    it: [
      {
        d: 1,
        ty: 'el',
        s: { a: 0, k: size },
        p: { a: 0, k: [0, 0] },
        nm: `${name} path`,
      },
      stroke(color, width, opacity, dashed),
      groupTransform(),
    ],
  };
}

function circle(name, diameter, color, opacity = 100, outline = null) {
  const items = [
    {
      d: 1,
      ty: 'el',
      s: { a: 0, k: [diameter, diameter] },
      p: { a: 0, k: [0, 0] },
      nm: `${name} path`,
    },
    fill(color, opacity),
  ];
  if (outline) items.push(stroke(outline.color, outline.width, outline.opacity));
  items.push(groupTransform());
  return { ty: 'gr', nm: name, it: items };
}

function shapeLayer(ind, name, shapes, transform = staticTransform(), opacity = null) {
  const ks = { ...transform };
  if (opacity) ks.o = opacity;
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks,
    ao: 0,
    shapes,
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0,
  };
}

function orbitPoint(angle, radiusX, radiusY) {
  const a = angle * DEG;
  const r = ROTATION * DEG;
  const x = radiusX * Math.cos(a);
  const y = radiusY * Math.sin(a);
  return [
    CENTER[0] + x * Math.cos(r) - y * Math.sin(r),
    CENTER[1] + x * Math.sin(r) + y * Math.cos(r),
  ];
}

function orbitKeyframes(radiusX, radiusY, turns, samples) {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (FRAMES * i) / samples;
    const angle = -45 + (360 * turns * i) / samples;
    const [x, y] = orbitPoint(angle, radiusX, radiusY);
    const keyframe = {
      t,
      s: [Number(x.toFixed(3)), Number(y.toFixed(3)), 0],
    };
    if (i < samples) {
      const [endX, endY] = orbitPoint(
        -45 + (360 * turns * (i + 1)) / samples,
        radiusX,
        radiusY,
      );
      keyframe.e = [Number(endX.toFixed(3)), Number(endY.toFixed(3)), 0];
      keyframe.o = { x: [0.333], y: [0.333] };
      keyframe.i = { x: [0.667], y: [0.667] };
    }
    return keyframe;
  });
}

function opacityPulse(at) {
  const lead = Math.max(0, at - 12);
  const settle = Math.min(FRAMES, at + 12);
  const fade = Math.min(FRAMES, at + 42);
  return {
    a: 1,
    k: [
      { t: 0, s: [18], h: 1 },
      { t: lead, s: [18], e: [100], o: { x: [0.2], y: [0.75] }, i: { x: [0.34], y: [0.94] } },
      { t: at, s: [100], e: [100], h: 1 },
      { t: settle, s: [100], e: [26], o: { x: [0], y: [0.65] }, i: { x: [0.51], y: [0.99] } },
      { t: fade, s: [26], h: 1 },
      { t: FRAMES, s: [26] },
    ],
  };
}

function receiptLayer(ind, angle, at) {
  const [x, y] = orbitPoint(angle, 318, 132);
  const ticket = {
    ty: 'gr',
    nm: `Receipt ${String(ind).padStart(2, '0')}`,
    it: [
      {
        ty: 'rc',
        d: 1,
        s: { a: 0, k: [50, 34] },
        p: { a: 0, k: [0, 0] },
        r: { a: 0, k: 2 },
        nm: 'Ticket',
      },
      fill(COLORS.paper),
      stroke(COLORS.blue, 2, 100),
      groupTransform(),
    ],
  };
  const ruleOne = {
    ty: 'gr',
    nm: 'Receipt rule one',
    it: [
      { ty: 'rc', d: 1, s: { a: 0, k: [24, 2] }, p: { a: 0, k: [-5, -6] }, r: { a: 0, k: 0 }, nm: 'Rule' },
      fill(COLORS.inkDim, 80),
      groupTransform(),
    ],
  };
  const ruleTwo = {
    ty: 'gr',
    nm: 'Receipt rule two',
    it: [
      { ty: 'rc', d: 1, s: { a: 0, k: [18, 2] }, p: { a: 0, k: [-8, 2] }, r: { a: 0, k: 0 }, nm: 'Rule' },
      fill(COLORS.inkDim, 60),
      groupTransform(),
    ],
  };
  const stampMark = {
    ty: 'gr',
    nm: 'Receipt stamp',
    it: [
      { ty: 'rc', d: 1, s: { a: 0, k: [7, 7] }, p: { a: 0, k: [15, 9] }, r: { a: 0, k: 1 }, nm: 'Stamp' },
      fill(COLORS.red),
      groupTransform(),
    ],
  };
  const transform = staticTransform([x, y], [100, 100, 100], ROTATION + angle + 90);
  transform.s = {
    a: 1,
    k: [
      { t: 0, s: [88, 88, 100], h: 1 },
      { t: Math.max(0, at - 12), s: [88, 88, 100], e: [108, 108, 100], o: { x: [0.2], y: [0.75] }, i: { x: [0.34], y: [0.94] } },
      { t: at, s: [108, 108, 100], e: [100, 100, 100], o: { x: [0], y: [0.65] }, i: { x: [0.51], y: [0.99] } },
      { t: Math.min(FRAMES, at + 12), s: [100, 100, 100], h: 1 },
      { t: FRAMES, s: [100, 100, 100] },
    ],
  };
  return shapeLayer(ind, `Receipt gate ${angle}`, [ticket, ruleOne, ruleTwo, stampMark], transform, opacityPulse(at));
}

const layers = [
  shapeLayer(1, 'Outer loop pilot', [
    circle('Pilot halo', 52, COLORS.blue, 11),
    circle('Pilot', 22, COLORS.blue, 100, { color: COLORS.paper, width: 4, opacity: 100 }),
    circle('Pilot fix', 7, COLORS.paper, 100),
  ], (() => {
    const transform = staticTransform([0, 0]);
    transform.p = { a: 1, k: orbitKeyframes(318, 132, 1, 120) };
    return transform;
  })()),
  receiptLayer(2, 0, 38),
  receiptLayer(3, 90, 113),
  receiptLayer(4, 180, 188),
  receiptLayer(5, 270, 263),
  shapeLayer(6, 'EDS mass', [
    circle('Core outer', 178, COLORS.ink, 100),
    circle('Core middle', 132, COLORS.paperDeep, 100),
    circle('Core inner', 92, COLORS.ink, 100),
    circle('Core point', 13, COLORS.blue, 100),
  ]),
  shapeLayer(8, 'Gravity field rings', [
    ellipse('Gravity field 01', [238, 238], COLORS.ink, 2, 16),
    ellipse('Gravity field 02', [286, 286], COLORS.ink, 2, 10),
  ]),
  shapeLayer(9, 'Inner render loop', [
    ellipse('Inner orbit', [212, 212], COLORS.green, 3, 72, true),
  ]),
  shapeLayer(10, 'Outer operation loop', [
    ellipse('Outer orbit', [636, 264], COLORS.blue, 4, 82, true),
  ], staticTransform(CENTER, [100, 100, 100], ROTATION)),
  shapeLayer(11, 'Outer loop guide', [
    ellipse('Outer guide', [674, 302], COLORS.ink, 2, 10),
  ], staticTransform(CENTER, [100, 100, 100], ROTATION)),
];

const lottie = {
  v: '5.7.0',
  fr: FPS,
  ip: 0,
  op: FRAMES,
  w: WIDTH,
  h: HEIGHT,
  nm: 'da-cli 0.6.6 — The Outer Loop',
  ddd: 0,
  assets: [],
  layers,
  markers: [
    { tm: 38, cm: 'receipt-01', dr: 0 },
    { tm: 113, cm: 'receipt-02', dr: 0 },
    { tm: 188, cm: 'receipt-03', dr: 0 },
    { tm: 263, cm: 'receipt-04', dr: 0 },
  ],
};

const output = process.argv[2] || join(process.cwd(), 'media', 'outer-loop-hero.lottie.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(lottie)}\n`);
console.log(`outer-loop-lottie: wrote ${output} (${layers.length} layers, ${FRAMES / FPS}s loop)`);
