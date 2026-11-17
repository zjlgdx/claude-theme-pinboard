import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { ALT, drawBoard } from './board'
import { makeColors } from './make-colors.js'
import { cardColor, cardCorner, cardFoot, cardTopMid, doodle, pin, tapeBand } from './paper'

const PLUGIN = 'pinboard'
const SCENE = 'cork'

// Whether Claude is working on a turn: the lights run while it is.
const busy = atom({ plugin: 'pinboard', key: 'busy' } as const, false)

// Cream paper by day, the same board under a lamp by night. Ink blue for the
// accent, like the ballpoint on the notes.
const { theme, problems } = makeColors({
  label: 'Pinboard',
  roles: { accent: '#36598a', danger: '#b3392f', success: '#4e7d3a', warning: '#a86f14', pro: '#6d4f94' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e9dbc1',
        'surface-1': '#ecdcc0',
        'surface-2': '#f4ead7',
        'text-primary': '#2b231b',
        'text-secondary': '#54483a',
        'text-muted': '#6b5e4d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1d1915',
        'surface-1': '#2a231b',
        'surface-2': '#2c2620',
        'surface-3': '#312a23',
        'text-primary': '#f0e6d4',
        'text-secondary': '#cdc1ae',
        'text-muted': '#a89c89',
      },
    },
  },
})

// The board draws a torn paper strip down the middle of the window, as the
// words sit when the sidebar is closed. The app's own frosted column follows
// the words wherever they are, so it stays as a thin safety tint: enough to
// keep them readable when a sidebar or pane moves them off the strip, little
// enough that its soft edge doesn't fog the strip's torn one.
const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 0, opacity: 0.25 } },
}

// Each message tears its card the same way every time it is drawn.
const seedOf = (id: string) => {
  let h = 2166136261

  for (let i = 0; i < id.length; i += 1) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  }

  return (h >>> 0) % 100000
}

const working = async ($: EngineInterface, isBusy: boolean) => {
  if ((await read($, busy)) !== isBusy) {
    await update($, busy, () => isBusy)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    // A terminal draws no look: the theme stands and draws once the desktop
    // or mobile app attaches, so there is nothing to say here.
    await $.theme.set(LOOK)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await working($, true)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await working($, false)

    return next(e)
  })

  // Each block of a reply on its own torn scrap, taped at both corners, with
  // an ink doodle beside it. The desktop app only: the terminal draws no images.
  on('ui.render', { component: 'AssistantMessage', plugin: '*' }, async ($, e, next) => {
    if (e.surface !== 'desktop') {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)
    const seed = seedOf(e.requestId)
    const reply = await next(e)

    return (
      <Box flexDirection="row" gap="sm" marginTop="xs" marginBottom="xs">
        {/* Kept at full width: an image may shrink to nothing in a flex row. */}
        <Box paddingTop="lg" flexShrink={0}>
          <Svg source={doodle(seed)} alt="doodle" width={28} height={28} />
        </Box>
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Box flexDirection="row">
          <Svg source={cardCorner(seed, 'left')} alt="tape" width={84} height={24} />
          <Box flexGrow={1} flexShrink={1} overflow="hidden">
            <Svg source={cardTopMid(seed)} alt="torn paper" height={24} />
          </Box>
          <Svg source={cardCorner(seed, 'right')} alt="tape" width={84} height={24} />
        </Box>
        <Box backgroundColor={cardColor(seed)} paddingX="lg" paddingY="xs">
          {reply}
        </Box>
        <Box overflow="hidden">
          <Svg source={cardFoot(seed)} alt="torn paper" height={14} />
        </Box>
        </Box>
      </Box>
    )
  })

  // A run of tool calls: its count line on a strip of tape, under a pin, both
  // in a color the run's id picks.
  on('ui.render', { component: 'ToolGroup', plugin: '*' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.isExpanded) {
      return next(e)
    }
    const { Box, Svg } = $.ui.resolve(e)
    const seed = seedOf(e.requestId)
    const line = await next(e)

    return (
      <Box flexDirection="row" alignItems="center" gap="sm" paddingLeft="xl">
        <Svg source={pin(seed)} alt="pin" width={16} height={16} />
        <Box backgroundColor={tapeBand(seed)} paddingX="sm" flexShrink={1}>
          {line}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const isOurs = e.props.plugin === PLUGIN && e.props.scene === SCENE

    if (!isOurs || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const source = drawBoard({ isBusy: await read($, busy), seconds: (await $.clock.now()) / 1000 })

    return <Svg source={source} alt={ALT} isInteractive />
  })
}
