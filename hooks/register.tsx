import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { ALT, drawBoard } from './board'
import { makeColors } from './make-colors.js'

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
        'surface-0': '#efe6d4',
        'surface-1': '#f5eddd',
        'surface-2': '#faf5ea',
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
        'surface-1': '#25201a',
        'surface-2': '#2c2620',
        'surface-3': '#312a23',
        'text-primary': '#f0e6d4',
        'text-secondary': '#cdc1ae',
        'text-muted': '#a89c89',
      },
    },
  },
})

// Frosted enough to read on, clear enough to see the board through it.
const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 14, opacity: 0.62 } },
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
