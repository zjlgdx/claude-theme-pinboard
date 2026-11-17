// The pinboard: a cork board of pinned paper scraps along both edges of the
// window, under a string of small lights. By day the lights are unlit; at
// night a lamp warms the board and the lights glow. While Claude works the
// lights come on and run along the string.
//
// One SVG for both modes: colors are CSS variables switched by
// prefers-color-scheme. The art keeps to two bands, one pinned to each edge,
// and the conversation sits on a strip of torn paper in the middle.

const W = 1600
const H = 1000
// The width of each edge band, in the board's units.
const BAND = 540

export type Live = {
  /** Claude is working on a turn. */
  isBusy: boolean
  /** Seconds since the epoch, so a redraw resumes the motion where it was. */
  seconds: number
}

const random = (seed: number) => {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (v: number) => Math.round(v * 10) / 10

const HAND = `font-family:'Bradley Hand','Noteworthy','Chalkboard SE','Segoe Print','Comic Sans MS',cursive`
const TYPE = `font-family:'American Typewriter','Courier New',ui-monospace,monospace`

const LIGHT = {
  cork: '#bb8d5e', g1: '#d1a372', g2: '#9c7147', vig: '0.16',
  paper: '#f5ecda', paperEdge: '#e9dcc2', fringe: '#fcf8ee', fiber: '#b89a72', ring: '#8a5a2b', ringOp: '0.13',
  veil: '0', lamp: '0', bulb: '#f1ead6', idle: '0',
}
const DARK = {
  cork: '#b88a5c', g1: '#cfa06f', g2: '#9b7047', vig: '0.55',
  paper: '#2b241d', paperEdge: '#231d17', fringe: '#4a3f33', fiber: '#8a7559', ring: '#c79a63', ringOp: '0.1',
  veil: '0.6', lamp: '0.3', bulb: '#ffd98f', idle: '1',
}

const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';')

// Pinned to the edges: the root is sliced, so on narrower windows each band
// moves in by what the slice crops, and fades once it reaches the words.
const EDGES =
  [
    [150, 50], [140, 100], [130, 150], [120, 200], [110, 250], [100, 300],
    [90, 350], [80, 400], [70, 450], [60, 500], [50, 550],
  ]
    .map(([ar, c]) => `@media (max-aspect-ratio:${ar}/100){.L{transform:translateX(${c}px)}.R{transform:translate(${W - BAND - (c ?? 0)}px,0)}}`)
    .join('') +
  `@media (max-aspect-ratio:110/100){.L,.R{opacity:.55}}@media (max-aspect-ratio:75/100){.L,.R{opacity:.35}}`

// ---------- small things ----------

const pin = (x: number, y: number, color: string) =>
  `<g><ellipse cx="${x + 3}" cy="${y + 5}" rx="7" ry="4" fill="#000" opacity=".22"/>` +
  `<circle cx="${x}" cy="${y}" r="8" fill="${color}"/><circle cx="${x}" cy="${y}" r="8" fill="url(#pinShade)"/>` +
  `<circle cx="${x - 2.6}" cy="${y - 2.8}" r="2.4" fill="#fff" opacity=".75"/></g>`

const tape = (x: number, y: number, w: number, h: number, rot: number, color: string, seed: number) => {
  const next = random(seed)
  const edge = (side: number) =>
    Array.from({ length: 7 }, (_, i) => `${r1(side + (next() * 3 - 1.5) * (side === 0 ? -1 : 1))},${r1((h * i) / 6)}`)
  const points = [...edge(0), ...edge(w).reverse()].join(' ')

  return `<g transform="translate(${x} ${y}) rotate(${rot})"><polygon points="${points}" fill="${color}" opacity=".76"/></g>`
}

/** A string of lights sagging from (x0,y0) to (x1,y1) through (cx,cy). */
const lights = (curve: readonly [number, number, number, number, number, number], count: number, seed: number, first: number) => {
  const [x0, y0, cx, cy, x1, y1] = curve
  const next = random(seed)
  let out = `<path class="wire" d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}"/>`

  for (let i = 1; i < count; i += 1) {
    const t = i / count
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
    const n = first + i
    out +=
      `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(next() * 30 - 15)})">` +
      `<circle class="glow b${n % 4}" style="animation-delay:${r1(-n * 0.19)}s" cy="13" r="24" fill="url(#bulbGlow)"/>` +
      `<rect x="-3" y="-1" width="6" height="6" rx="1" class="cap"/>` +
      `<ellipse class="bulb" cy="12" rx="4.6" ry="7"/></g>`
  }

  return out
}

const fern = () => {
  let s = `<path d="M0 0 Q 60 -10 150 -4 T 300 10" fill="none" stroke="#5b6e3c" stroke-width="2.4"/>`

  for (let i = 0; i < 16; i += 1) {
    const t = i / 16
    const x = r1(12 + t * 280)
    const y = -6 + Math.sin(t * 3) * 6
    const len = 34 * (1 - t * 0.75)
    s +=
      `<ellipse cx="${x}" cy="${r1(y - len / 2)}" rx="${r1(len / 5)}" ry="${r1(len / 2)}" fill="#6e8a4b" transform="rotate(${r1(28 - t * 10)} ${x} ${r1(y)})"/>` +
      `<ellipse cx="${x}" cy="${r1(y + len / 2)}" rx="${r1(len / 5)}" ry="${r1(len / 2)}" fill="#5d7a3e" transform="rotate(${r1(-28 + t * 10)} ${x} ${r1(y)})"/>`
  }

  return s
}

const lavender = () => {
  const next = random(5)
  let s = ''

  for (let k = 0; k < 3; k += 1) {
    const dx = k * 16 - 16
    const lean = k * 10 - 8
    s += `<path d="M${dx} 0 Q ${dx + 6} -120 ${dx + lean} -230" fill="none" stroke="#6f7f55" stroke-width="2"/>`

    for (let i = 0; i < 12; i += 1) {
      const t = 0.55 + (i / 12) * 0.45
      const x = dx + lean * t + Math.sin(t * 3) * 3
      const y = -230 * t
      s +=
        `<ellipse cx="${r1(x - 4)}" cy="${r1(y)}" rx="3.6" ry="5.4" fill="${next() < 0.5 ? '#8a72b8' : '#a28ccc'}"/>` +
        `<ellipse cx="${r1(x + 4)}" cy="${r1(y - 3)}" rx="3.4" ry="5" fill="${next() < 0.5 ? '#7d66ad' : '#9b85c6'}"/>`
    }
  }

  return s
}

const STAMPS: readonly (readonly [string, string, string])[] = [
  ['#3f6b5c', 'tea', `<path d="M-22 -2 h40 v6 a20 20 0 0 1 -40 0 Z" fill="#f2ead8"/><path d="M18 2 a8 8 0 0 1 0 14" fill="none" stroke="#f2ead8" stroke-width="3"/><path d="M-10 -10 q4 -8 0 -16 M2 -10 q4 -8 0 -16" fill="none" stroke="#f2ead8" stroke-width="2" stroke-linecap="round"/>`],
  ['#d0674c', 'kite', `<path d="M0 -30 L18 -4 L0 26 L-18 -4 Z" fill="#f6e3c9"/><path d="M0 -30 V26 M-18 -4 H18" stroke="#d0674c" stroke-width="1.5"/><path d="M0 26 q-6 10 2 16 q8 6 0 14" fill="none" stroke="#f6e3c9" stroke-width="2"/>`],
  ['#26355c', 'moon', `<circle r="20" fill="#f3e2ae"/><circle cx="9" cy="-6" r="18" fill="#26355c"/><circle cx="-24" cy="-26" r="1.4" fill="#f3e2ae"/><circle cx="22" cy="22" r="1.2" fill="#f3e2ae"/>`],
  ['#d9a441', 'acorn', `<path d="M-16 -4 a16 16 0 0 1 32 0 Z" fill="#6b4a2b"/><path d="M-14 -2 h28 q0 26 -14 30 q-14 -4 -14 -30 Z" fill="#f4e6c6"/><path d="M0 -20 q2 -8 8 -10" stroke="#6b4a2b" stroke-width="2.4" fill="none"/>`],
]

const stamps = (x: number, y: number) => {
  const sheet = STAMPS.map(([bg, name, art], i) => {
    const sx = (i % 2) * 120
    const sy = Math.floor(i / 2) * 142
    const rot = [-4, 3, 5, -2][i] ?? 0

    return (
      `<g transform="translate(${sx} ${sy}) rotate(${rot} 52 62)" filter="url(#sh)"><rect width="104" height="124" fill="#fbf7ee" mask="url(#perf)"/>` +
      `<rect x="9" y="9" width="86" height="88" fill="${bg}"/><g transform="translate(52 53)">${art}</g>` +
      `<text x="52" y="115" text-anchor="middle" class="type" font-size="10.5" fill="#5a5048" letter-spacing="1">${name} · 58</text></g>`
    )
  }).join('')
  const postmark =
    `<g transform="translate(64 40) rotate(-10)" fill="none" stroke="#3a3f55" stroke-width="1.4" opacity=".5"><circle r="28"/><circle r="22"/>` +
    `<path d="M32 -8 q 11 -8 22 0 t 22 0 t 22 0 M32 4 q 11 -8 22 0 t 22 0 t 22 0 M32 16 q 11 -8 22 0 t 22 0 t 22 0"/></g>`

  return `<g transform="translate(${x} ${y})">${sheet}${postmark}</g>`
}

const PERF = (() => {
  let holes = ''

  for (let i = 0; i <= 13; i += 1) holes += `<circle cx="${r1(i * 8)}" cy="0" r="3.2"/><circle cx="${r1(i * 8)}" cy="124" r="3.2"/>`
  for (let i = 0; i <= 15; i += 1) holes += `<circle cx="0" cy="${r1(i * 8.27)}" r="3.2"/><circle cx="104" cy="${r1(i * 8.27)}" r="3.2"/>`

  return `<mask id="perf"><rect width="104" height="124" fill="#fff"/><g fill="#000">${holes}</g></mask>`
})()

const GRAINS = (() => {
  const next = random(7)
  let s = ''

  for (let i = 0; i < 90; i += 1) {
    const x = r1(next() * 160)
    const y = r1(next() * 160)
    const rx = r1(0.8 + next() * 2.2)
    const ry = r1(0.6 + next() * 1.4)
    const a = Math.round(next() * 180)
    s += `<ellipse class="${next() < 0.5 ? 'g1' : 'g2'}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`
  }

  return s
})()

// ---------- the two edges ----------

// Left band. On a common window about 370 of its 540 units show beside the
// conversation; the rest slides under the frosted column.
const LEFT =
  // graph paper with a paper-boat plan
  `<g transform="translate(34 92) rotate(-3)" filter="url(#sh)">` +
  `<rect width="276" height="330" class="sheet"/><rect width="276" height="330" fill="url(#grid)"/>` +
  `<text x="22" y="44" class="hand pencil" font-size="24">fold no. 3</text>` +
  `<g class="pen" fill="none" stroke-width="1.7" stroke-linejoin="round">` +
  `<path d="M138 98 L138 218 L80 218 Z"/><path d="M146 82 L146 218 L208 218 Z"/>` +
  `<path d="M52 224 L226 224 L196 266 L84 266 Z"/><path d="M52 224 L84 266" stroke-dasharray="4 4"/>` +
  `<path d="M44 292 L234 292 M44 284 L44 300 M234 284 L234 300"/><path d="M44 292 l9 -4 m-9 4 l9 4 M234 292 l-9 -4 m9 4 l-9 4"/></g>` +
  `<text x="118" y="316" class="hand pencil" font-size="16">14 cm</text>` +
  `<text x="178" y="62" class="hand pencil" font-size="15" transform="rotate(8 178 62)">a sail?</text></g>` +
  tape(128, 78, 90, 25, 4, '#9fd0b6', 11) +
  // polaroid: a cabin under the moon
  `<g transform="translate(44 476) rotate(4)" filter="url(#sh)">` +
  `<rect width="236" height="278" class="photo"/><rect x="15" y="15" width="206" height="200" fill="url(#nightSky)"/>` +
  [[42, 50, 1.4], [86, 32, 1], [66, 90, 1.1], [190, 112, 1.2], [118, 60, 0.9], [200, 42, 1], [164, 28, 0.8], [34, 120, 0.8]]
    .map(([x, y, r], i) => `<circle class="star s${i % 3}" cx="${x}" cy="${y}" r="${r}" fill="#f6ebc4"/>`).join('') +
  `<circle cx="158" cy="68" r="19" fill="#f3e2ae"/><circle cx="167" cy="62" r="17" fill="#26355c"/>` +
  `<path d="M15 184 Q 66 142 112 166 T 221 150 L221 215 L15 215 Z" fill="#1a2440"/>` +
  `<path d="M15 201 Q 84 178 150 193 T 221 188 L221 215 L15 215 Z" fill="#131b31"/>` +
  `<path d="M68 180 l17 -13 l17 13 v15 h-34 Z" fill="#0f1628"/><rect class="cabin" x="80" y="182" width="8" height="8"/>` +
  `<text x="26" y="254" class="hand ink" font-size="21">night shift</text></g>` +
  tape(26, 476, 72, 23, -38, '#f2a7b5', 4) +
  pin(166, 480, '#e3b23c') +
  // fern sprig, under the card
  `<g transform="translate(24 980) rotate(-60)">${fern()}</g>` +
  // index card
  `<g transform="translate(150 768) rotate(-3)" filter="url(#sh)">` +
  `<rect width="214" height="166" class="card"/><path d="M0 40 H214" stroke="#e08a8a" stroke-width="1.4"/>` +
  [62, 87, 112, 137].map(y => `<path d="M0 ${y} H214" stroke="#a8c4dc" stroke-width="1"/>`).join('') +
  `<text x="16" y="30" class="hand ink" font-size="22">today</text>` +
  ([['read the code', true], ['think it through', true], ['make it lovely', false]] as const)
    .map(([words, done], i) =>
      `<rect x="16" y="${47 + i * 25}" width="12" height="12" fill="none" class="penS"/>` +
      (done ? `<path d="M17 ${53 + i * 25} l4 5 l9 -11" class="tick"/>` : '') +
      `<text x="37" y="${58 + i * 25}" class="hand ink" font-size="17">${words}</text>`)
    .join('') +
  `</g>` +
  // the tag on its pin, swaying, and red string down to the card
  `<path d="M298 104 Q 368 470 266 772" class="string"/>` +
  `<g transform="translate(298 104)"><g class="sway">` +
  `<path d="M0 0 C -6 24 6 40 0 66" class="twine"/>` +
  `<g transform="rotate(-8 0 70)" filter="url(#sh)"><path d="M-40 90 L-20 66 L20 66 L40 90 L40 222 L-40 222 Z" class="kraft"/>` +
  `<circle cy="80" r="5.5" class="hole"/><circle cy="80" r="8.5" fill="none" class="ring"/>` +
  `<text y="130" text-anchor="middle" class="hand ink" font-size="21">made</text>` +
  `<text y="158" text-anchor="middle" class="hand ink" font-size="21">slowly</text>` +
  `<text y="190" text-anchor="middle" class="hand ink2" font-size="14">with care</text></g>` +
  `</g>${pin(0, 0, '#c8423b')}</g>` +
  pin(266, 772, '#3f6fb3')

// Right band, drawn from x=0 at the band's left; what matters sits right of 170.
const RIGHT =
  // sticky note and its clip
  `<g transform="translate(300 92) rotate(4)" filter="url(#sh)">` +
  `<path d="M0 0 H200 V172 L176 196 H0 Z" class="sticky"/><path d="M200 172 L176 196 L180 176 Z" class="stickyFold"/>` +
  `<text x="18" y="42" class="hand ink" font-size="22">remember:</text>` +
  `<path d="M18 50 q 50 6 104 -2" class="penS" fill="none"/>` +
  `<text x="18" y="88" class="hand ink" font-size="20">small steps,</text>` +
  `<text x="18" y="120" class="hand ink" font-size="20">big picture.</text>` +
  `<text x="116" y="162" class="hand ink2" font-size="15">— me</text></g>` +
  `<path d="M336 76 v56 a10 10 0 0 0 20 0 v-62 a15 15 0 0 0 -30 0 v54" class="clip" transform="rotate(4 336 76)"/>` +
  // train ticket
  `<g transform="translate(196 340) rotate(-6)" filter="url(#sh)">` +
  `<path d="M0 0 H300 V48 a10 10 0 0 0 0 20 V128 H0 V68 a10 10 0 0 0 0 -20 Z" class="ticket"/>` +
  `<path d="M228 8 V120" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 5"/>` +
  `<text x="20" y="30" class="type tk" font-size="12" letter-spacing="3">OUTBOUND · SINGLE</text>` +
  `<text x="20" y="76" class="hand tkInk" font-size="33">platform 2</text>` +
  `<text x="20" y="107" class="type tk" font-size="12.5" letter-spacing="1">07:42 · coach c · seat 14</text>` +
  `<text class="type tk" font-size="12" letter-spacing="2" transform="translate(268 26) rotate(90)">No. 0417</text></g>` +
  pin(226, 350, '#4f8a5b') +
  // stamps
  stamps(296, 560) +
  // paint swatches, a strip along the foot
  `<g transform="translate(176 870) rotate(-7)" filter="url(#sh)">` +
  `<rect width="290" height="82" class="card"/>` +
  ([['#e9dcc3', 'oat'], ['#c98b62', 'clay'], ['#a4542f', 'rust'], ['#6e7f4d', 'moss'], ['#2f3b4c', 'ink']] as const)
    .map(([c, name], i) => `<rect x="${8 + i * 56}" y="8" width="50" height="48" fill="${c}"/><text x="${10 + i * 56}" y="72" class="type pencil" font-size="10" letter-spacing="1">${name}</text>`)
    .join('') +
  `</g>` +
  tape(300, 858, 64, 21, 4, '#f3d27a', 21) +
  // lavender
  `<g transform="translate(496 1000) rotate(-6)">${lavender()}</g>` +
  tape(458, 898, 66, 21, -24, '#c7b8e6', 31)


// The strip of paper the conversation is written on: torn down both sides,
// a fixed width in screen points, centred under the words whatever the
// window's shape. Drawn in points, so it sits outside the sliced board.
const STRIP_HALF = 410
const STRIP_TALL = 3200

const tornEdge = (seed: number, x: number, down: boolean) => {
  const rand = random(seed)
  const points: string[] = []

  for (let y = -40; y <= STRIP_TALL; y += 7 + rand() * 6) {
    const notch = rand() < 0.06 ? 4 + rand() * 4 : 0
    const dx = (rand() - 0.5) * 4 + (x < 0 ? notch : -notch)
    points.push(`${r1(x + dx)} ${r1(y)}`)
  }

  return (down ? points : points.reverse()).join(' L')
}

const STRIP_PATH = `M${tornEdge(7, -STRIP_HALF, true)} L${tornEdge(19, STRIP_HALF, false)} Z`

const FIBERS = (() => {
  const rand = random(41)
  let out = ''

  for (let i = 0; i < 46; i += 1) {
    const x = r1(rand() * 240)
    const y = r1(rand() * 240)
    const len = 6 + rand() * 16
    const a = rand() * Math.PI
    out += `<path d="M${x} ${y} q${r1(Math.cos(a) * len * 0.5 + 2)} ${r1(Math.sin(a) * len * 0.5 - 2)} ${r1(Math.cos(a) * len)} ${r1(Math.sin(a) * len)}"/>`
  }

  return out
})()

const SPECKS = (() => {
  const rand = random(53)
  let out = ''

  for (let i = 0; i < 70; i += 1) {
    out += `<circle cx="${r1(rand() * 240)}" cy="${r1(rand() * 240)}" r="${r1(0.4 + rand() * 0.9)}"/>`
  }

  return out
})()

// A strip of washi tape holding the paper to the cork, centred on (x, y).
const stripTape = (x: number, y: number, rot: number, cls: string, seed: number) => {
  const rand = random(seed)
  const w = 118
  const h = 30
  const jag = (side: number) =>
    Array.from({ length: 6 }, (_, i) => `${r1(side === 0 ? rand() * 4 : w - rand() * 4)},${r1((h * i) / 5)}`)
  const outline = [...jag(0), ...jag(1).reverse()].join(' ')

  return (
    `<g transform="translate(${x} ${y}) rotate(${rot}) translate(${-w / 2} ${-h / 2})">` +
    `<polygon points="${outline}" class="washi ${cls}"/>` +
    `<path d="M6 ${h * 0.3} H${w - 6} M6 ${h * 0.7} H${w - 6}" class="washiLine" stroke-dasharray="3 4"/></g>`
  )
}

// A faint ring left by a mug, two arcs that don't quite meet.
const RING =
  `<g class="ring2" fill="none" stroke-linecap="round">` +
  `<path d="M-44 6 A46 44 0 0 1 40 -22" stroke-width="5"/><path d="M44 -6 A46 44 0 0 1 -30 36" stroke-width="3.5"/>` +
  `<path d="M-40 14 A42 40 0 0 0 -8 41" stroke-width="1.5"/></g>`

const STRIP =
  `<svg x="50%" y="0" width="1" height="1" overflow="visible">` +
  `<path d="${STRIP_PATH}" class="paperBody" filter="url(#stripSh)"/>` +
  `<path d="${STRIP_PATH}" fill="url(#fibers)" opacity=".5"/>` +
  `<path d="${STRIP_PATH}" fill="url(#specks)"/>` +
  stripTape(-STRIP_HALF + 8, 58, -38, 'w0', 3) + stripTape(STRIP_HALF - 8, 58, 36, 'w1', 5) +
  `</svg>` +
  `<svg x="50%" y="100%" width="1" height="1" overflow="visible">` +
  `<g transform="translate(${STRIP_HALF - 130} -190) rotate(-14)">${RING}</g>` +
  stripTape(-STRIP_HALF + 8, -40, 34, 'w2', 7) + stripTape(STRIP_HALF - 8, -40, -32, 'w3', 9) +
  `</svg>`

const LIGHTS_LEFT = lights([-20, 14, 150, 92, 560, 18], 9, 3, 0)
const LIGHTS_RIGHT = lights([-20, 22, 300, 98, 560, 8], 9, 8, 9)

const DEFS =
  `<filter id="stripSh" x="-10%" y="-1%" width="120%" height="102%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dx="0" dy="3"/>` +
  `<feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<linearGradient id="paperG" gradientUnits="userSpaceOnUse" x1="${-STRIP_HALF}" x2="${STRIP_HALF}" y1="0" y2="0">` +
  `<stop offset="0" class="pe"/><stop offset=".05" class="pp"/><stop offset=".95" class="pp"/><stop offset="1" class="pe"/></linearGradient>` +
  `<pattern id="specks" width="240" height="240" patternUnits="userSpaceOnUse"><g class="speck">${SPECKS}</g></pattern>` +
  `<pattern id="fibers" width="240" height="240" patternUnits="userSpaceOnUse"><g fill="none" stroke-width=".8" class="fiber">${FIBERS}</g></pattern>` +
  `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="2" dy="6"/>` +
  `<feComponentTransfer><feFuncA type="linear" slope=".28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
  `<radialGradient id="pinShade" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>` +
  PERF +
  `<pattern id="corkTex" width="160" height="160" patternUnits="userSpaceOnUse">${GRAINS}</pattern>` +
  `<pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse"><path d="M15 0 H0 V15" fill="none" stroke="#9ec0d8" stroke-width=".7" opacity=".7"/></pattern>` +
  `<linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a4f"/><stop offset="1" stop-color="#34436c"/></linearGradient>` +
  `<radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="lampG" cx=".5" cy="-.05" r=".85"><stop offset="0" stop-color="#ffbf6e" stop-opacity="1"/><stop offset=".55" stop-color="#ff9f4a" stop-opacity=".25"/><stop offset="1" stop-color="#ff9f4a" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="vigG" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#2a1a0c" stop-opacity="0"/><stop offset="1" stop-color="#2a1a0c" stop-opacity="1"/></radialGradient>`

const STYLE_FIXED =
  `.speck{fill:var(--fiber);opacity:.28}.ring2{stroke:var(--ring);opacity:var(--ringOp)}` +
  `.washi{opacity:.86}.washiLine{fill:none;stroke:#fff;stroke-width:1;opacity:.35}.w0{fill:#e7cf86}.w1{fill:#efb2ad}.w2{fill:#a8d3bf}.w3{fill:#c5b8e6}` +
  `@media (prefers-color-scheme:dark){.washi{opacity:.62}}` +
  `.paperBody{fill:url(#paperG);stroke:var(--fringe);stroke-width:2.4}.pp{stop-color:var(--paper)}.pe{stop-color:var(--paperEdge)}.fiber{stroke:var(--fiber);opacity:.35}` +
  `.cork{fill:var(--cork)}.g1{fill:var(--g1);opacity:.55}.g2{fill:var(--g2);opacity:.5}` +
  `.sheet{fill:#f7f6f1}.photo{fill:#fbf8f1}.card{fill:#fdfcf6}.kraft{fill:#c99c63}.sticky{fill:#f4dc84}.stickyFold{fill:#d9bd60}.ticket{fill:#7fb0a0}` +
  `.hand{${HAND}}.type{${TYPE}}.ink{fill:#2c3a55}.ink2{fill:#5a6377}.pencil{fill:#5d6670}.tk{fill:#f4f1e6}.tkInk{fill:#1f3b36}` +
  `.pen{stroke:#2c3a55}.penS{stroke:#2c3a55;stroke-width:1.4}.tick{fill:none;stroke:#c0392b;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}` +
  `.twine{fill:none;stroke:#8b6b45;stroke-width:1.6}.hole{fill:var(--cork)}.ring{stroke:#a88050;stroke-width:2}` +
  `.string{fill:none;stroke:#b8352e;stroke-width:1.7;opacity:.9}.clip{fill:none;stroke:#9aa3ab;stroke-width:2.6;stroke-linecap:round}` +
  `.wire{fill:none;stroke:#4b3b2b;stroke-width:1.4;opacity:.8}.cap{fill:#6e6252}.bulb{fill:var(--bulb)}` +
  `.cabin{fill:#f7c96b}.veil{fill:#1a0f07;opacity:var(--veil)}.lamp{opacity:var(--lamp)}.vig{opacity:var(--vig)}` +
  `.sway{transform-box:fill-box;transform-origin:50% 0}` +
  `@keyframes sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}` +
  `@keyframes twinkle{0%,100%{opacity:var(--idle)}50%{opacity:calc(var(--idle) * .35)}}` +
  `@keyframes chase{0%,100%{opacity:.25}35%{opacity:1}}` +
  `.star{animation:star 4s ease-in-out infinite}.s1{animation-duration:5.5s;animation-delay:-2s}.s2{animation-duration:7s;animation-delay:-4s}` +
  `@keyframes star{0%,100%{opacity:1}50%{opacity:.35}}`

/** The whole board as one SVG, for the session as it is now. */
export const drawBoard = (live: Live) => {
  // Each animation picks up where the clock says it is, so a redraw doesn't jump.
  const at = (period: number) => `${r1(-(live.seconds % period))}s`
  const motion = live.isBusy
    ? `.sway{animation:sway 2.8s ease-in-out ${at(5.6)} infinite alternate}` +
      `.glow{animation:chase 1.6s ease-in-out infinite}.bulb{fill:#ffd98f}`
    : `.sway{animation:sway 7s ease-in-out ${at(14)} infinite alternate}` +
      `.glow{opacity:var(--idle)}.b0{animation:twinkle 3.1s ease-in-out infinite}.b1{animation:twinkle 4.3s ease-in-out infinite}` +
      `.b2{animation:twinkle 5.7s ease-in-out infinite}.b3{animation:twinkle 7.9s ease-in-out infinite}`
  const style =
    `:root{${vars(LIGHT)}}@media (prefers-color-scheme:dark){:root{${vars(DARK)}}}` +
    STYLE_FIXED + motion + EDGES +
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`
  const band = (cls: string, content: string) =>
    cls === 'L' ? `<g class="L">${content}</g>` : `<g class="R" transform="translate(${W - BAND} 0)">${content}</g>`

  return (
    // The root is the backdrop's own box in points; the board inside it is sliced.
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    `<style>${style}</style><defs>${DEFS}</defs>` +
    `<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<rect width="${W}" height="${H}" class="cork"/><rect width="${W}" height="${H}" fill="url(#corkTex)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#vigG)" class="vig"/>` +
    band('L', LEFT) + band('R', RIGHT) +
    // night: a warm veil, the lamp's pool, then the lights above both
    `<rect width="${W}" height="${H}" class="veil"/><rect width="${W}" height="${H}" fill="url(#lampG)" class="lamp"/>` +
    `</svg>` +
    STRIP +
    `<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    band('L', LIGHTS_LEFT) + band('R', LIGHTS_RIGHT) +
    `</svg></svg>`
  )
}

export const ALT = 'A cork board of pinned paper scraps along both edges, under a string of small lights that glow at night and run while Claude works'
