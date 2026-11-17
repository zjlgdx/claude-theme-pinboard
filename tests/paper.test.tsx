import { expect, test } from 'claude-code/testing'

// A hook here stands for the engine: what it draws for a message or a tool run.
const ENGINE = (words: string) => ($: any, e: any) => {
  const { Text } = $.ui.resolve(e)

  return <Text>{words}</Text>
}

const REPLY = {
  plugin: 'pinboard',
  component: 'AssistantMessage',
  requestId: 'msg-1',
  props: { text: 'All four tests pass.', isFirstOfReply: true },
} as const

const RUN = {
  plugin: 'pinboard',
  component: 'ToolGroup',
  requestId: 'group-1',
  props: { calls: [], isActive: false, isExpanded: false, command: 'Read' },
} as const

test('a reply sits on a torn card in the desktop app, and is kept', async ($, on) => {
  on('ui.render', ENGINE('All four tests pass.'))
  const ui = await $.ui.mount({ ...REPLY, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /four tests/ }))?.text).toBe('All four tests pass.')
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test('the terminal draws the reply as the engine does', async ($, on) => {
  on('ui.render', ENGINE('All four tests pass.'))
  const ui = await $.ui.mount({ ...REPLY, surface: 'terminal' })

  expect((await ui.find({ type: 'Text', text: /four tests/ }))?.text).toBe('All four tests pass.')
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})

test('a tool run sits on tape under a pin in the desktop app', async ($, on) => {
  on('ui.render', ENGINE('Read 1 file'))
  const ui = await $.ui.mount({ ...RUN, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /Read 1 file/ }))?.text).toBe('Read 1 file')
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})
