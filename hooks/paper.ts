// The paper pieces the conversation is drawn on: a kraft card behind each
// reply, torn at top and bottom and held by two strips of washi tape, and a
// strip of tape under each run of tool calls.
//
// The app tells a drawing nothing of light or dark, so the card's own color
// is a translucent kraft that reads on cream and on the lamp-lit dark alike.
// The torn edges and tape are SVG images, which switch their colors with
// prefers-color-scheme themselves.

/** The card's body: kraft at about 17% over whatever the column is. */
export const CARD = '#a57c4b2c'
const CARD_FILL = `fill="#a57c4b" fill-opacity="${(0x2c / 255).toFixed(3)}"`

/** A strip of tape behind a tool run's count line. */
export const TAPE_BAND = '#d8b45a38'

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

const TAPE_STYLE =
  `<style>.tp{fill:#e7d49b;opacity:.82}.tl{stroke:#c9b06a;opacity:.5}` +
  `@media (prefers-color-scheme:dark){.tp{fill:#9c8857;opacity:.72}.tl{stroke:#c4ad73;opacity:.35}}</style>`

// A torn line across 1000 units, `depth` deep, as points.
const tear = (seed: number, depth: number) => {
  const next = random(seed)
  const points: string[] = []
  let x = 0

  while (x < 1000) {
    points.push(`${r1(x)} ${r1(next() * depth)}`)
    x += 4 + next() * 7
  }
  points.push(`1000 ${r1(next() * depth)}`)

  return points
}

const piece = (w: number, h: number, seed: number) => {
  const next = random(seed)
  const jag = (side: 'l' | 'r') =>
    Array.from({ length: 6 }, (_, i) => {
      const y = (h * i) / 5
      const x = side === 'l' ? next() * 3 : w - next() * 3

      return `${r1(x)},${r1(y)}`
    })
  const outline = [...jag('l'), ...jag('r').reverse()].join(' ')

  return `<polygon class="tp" points="${outline}"/><path class="tl" d="M4 ${r1(h * 0.32)} H${w - 4} M4 ${r1(h * 0.68)} H${w - 4}" stroke-width="1" stroke-dasharray="2 3"/>`
}

// The torn line as a path across `w` x `h`, the paper below it.
const tornPath = (edge: string[], h: number, lift: number) =>
  `M0 ${h} L${edge.map(p => { const [x, y] = p.split(' '); return `${x} ${r1(Number(y) + lift)}` }).join(' L')} L1000 ${h} Z`

/**
 * The card's top, in three pieces laid in a row: a corner with tape, the torn
 * edge between (an image as wide as its slot, stretched sideways only), and the
 * other corner. Each is 24px high, the tear along the bottom 10.
 */
export const cardTopMid = (seed: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="24" viewBox="0 0 1000 24" preserveAspectRatio="none">` +
  `<path d="${tornPath(tear(seed, 6), 24, 15)}" ${CARD_FILL}/></svg>`

export const cardCorner = (seed: number, side: 'left' | 'right') => {
  const edge = tear(seed + (side === 'left' ? 3 : 5), 6)
  const tapeAt = side === 'left' ? 'translate(10 3) rotate(-6 34 9)' : 'translate(2 3) rotate(5 34 9)'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="24" viewBox="0 0 84 24">${TAPE_STYLE}` +
    `<svg width="84" height="24" viewBox="0 0 160 24" preserveAspectRatio="none"><path d="${tornPath(edge, 24, 15)}" ${CARD_FILL}/></svg>` +
    `<g transform="${tapeAt}">${piece(70, 18, seed + (side === 'left' ? 1 : 2))}</g></svg>`
  )
}

/** The card's foot: the same paper torn the other way, and a soft shadow under it. */
export const cardFoot = (seed: number) => {
  const edge = tear(seed + 9, 6)
  const torn = `M0 0 L1000 0 L${edge.map(p => { const [x, y] = p.split(' '); return `${x} ${r1(10 - Number(y) - 2)}` }).reverse().join(' L')} Z`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="14" viewBox="0 0 1000 14" preserveAspectRatio="none">` +
    `<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a18" stop-opacity=".16"/><stop offset="1" stop-color="#3a2a18" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${torn}" fill="url(#sh)" transform="translate(0 3)"/><path d="${torn}" ${CARD_FILL}/></svg>`
  )
}

/** A push pin, 16px square, for a tool run's line. */
export const PIN =
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">` +
  `<ellipse cx="9.5" cy="11" rx="5" ry="2.6" fill="#000" opacity=".18"/>` +
  `<circle cx="8" cy="7.5" r="5.5" fill="#c8423b"/><circle cx="6.2" cy="5.6" r="1.7" fill="#fff" opacity=".7"/></svg>`
