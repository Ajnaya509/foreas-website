// Real component effects, isolated clock and browser events. No network or customer data.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const fixtureRequire = createRequire(process.env.FOREAS_TEST_PACKAGE || path.join(__dirname, '../package.json'))
const React = fixtureRequire('react')
const { act, create } = fixtureRequire('react-test-renderer')
const ts = require('typescript')
global.IS_REACT_ACT_ENVIRONMENT = true

function events() {
  const listeners = new Map()
  return {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    dispatch(name, event = {}) { for (const fn of listeners.get(name) ?? []) fn(event) },
  }
}

async function setup({ coarse = true, surface = 'driver', seen = false } = {}) {
  let now = 1_000_000, nextId = 0, root
  const timers = new Map()
  const addTimer = (fn, delay, repeat) => { const id = ++nextId; timers.set(id, { fn, due: now + delay, delay, repeat }); return id }
  const timerApi = {
    setTimeout: (fn, delay) => addTimer(fn, delay, false),
    setInterval: (fn, delay) => addTimer(fn, delay, true),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id),
  }
  const state = { banner: 0, overlay: false, media: [], opened: 0 }
  const store = new Map(seen ? [['foreas_exit_invitation_seen', '1']] : [])
  const document = {
    ...events(), hidden: false, activeElement: null, body: {},
    documentElement: { ...events(), style: { overflow: '' } },
    querySelector: () => state.overlay ? {} : null,
    querySelectorAll: () => state.media,
  }
  const window = { ...events(), scrollY: 0 }
  const modal = { open: false, showModal() { this.open = true; state.opened++ }, close() { this.open = false }, querySelector: () => ({ focus() {} }) }
  const module = { exports: {} }
  const stub = () => null
  const mocks = {
    'react-dom': { createPortal: element => element },
    'next/image': stub, 'lucide-react': { ArrowUpRight: stub, Play: stub, X: stub },
    '@/components/experience/ForeasLogo': stub, './ActivityGlassReflection': stub,
    '@/lib/offre': { ESSAI_JOURS: 3 }, '@/lib/mesure': { mesurer() {} },
    '@/lib/overlayStore': { useAnyOverlayOpen: () => false, useOverlayLock() {} },
    './exit-invitation.module.css': {},
  }
  const source = fs.readFileSync(path.join(__dirname, '../src/components/home-premium/ExitInvitation.tsx'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText
  const context = vm.createContext({
    module, exports: module.exports, require: name => name in mocks ? mocks[name] : fixtureRequire(name),
    document, window, innerHeight: 800, URL, URLSearchParams, console,
    location: new URL('https://example.invalid/chauffeur'),
    sessionStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) },
    Date: class extends Date { static now() { return now } },
    getComputedStyle: () => ({ getPropertyValue: () => String(state.banner) }),
    matchMedia: query => ({ matches: query.includes('coarse') ? coarse : query.includes('fine') ? !coarse : false }),
    ...timerApi,
  })
  vm.runInContext(compiled, context)
  await act(async () => { root = create(React.createElement(module.exports.default, { surface }), { createNodeMock: node => node.type === 'dialog' ? modal : null }) })
  return {
    state, document, store,
    async advance(ms) {
      await act(async () => {
        const end = now + ms
        for (;;) {
          const due = [...timers].filter(([, t]) => t.due <= end).sort((a, b) => a[1].due - b[1].due)[0]
          if (!due) break
          const [id, timer] = due
          now = timer.due
          if (timer.repeat) timer.due += timer.delay; else timers.delete(id)
          timer.fn()
        }
        now = end
      })
    },
    async scroll(y) { await act(async () => { window.scrollY = y; window.dispatch('scroll') }) },
    async emit(name, event = {}) { await act(async () => { document.dispatch(name, event) }) },
    async hidden(value) { await act(async () => { document.hidden = value; document.dispatch('visibilitychange') }) },
    async leaveTop() { await act(async () => { document.dispatch('pointermove', { clientY: 100 }); document.documentElement.dispatch('mouseleave', { clientY: 0 }) }) },
    trigger() { return root.root.findByType('dialog').props['data-invitation-trigger'] },
    async dispose() { await act(async () => root.unmount()); assert.equal(timers.size, 0, 'all timers are removed') },
  }
}

test('a return halfway down the page remains eligible when 45 seconds elapse', async () => {
  const h = await setup()
  try {
    await h.advance(10_000); await h.scroll(2400); await h.scroll(2100)
    await h.advance(34_999); assert.equal(h.state.opened, 0)
    await h.advance(501); assert.equal(h.state.opened, 1); assert.equal(h.trigger(), 'mobile_return')
    await h.advance(60_000); assert.equal(h.state.opened, 1)
  } finally { await h.dispose() }
})

test('a reading pause opens without a return, but never during touch or scrolling', async () => {
  const h = await setup({ coarse: false })
  try {
    await h.emit('pointerdown', { pointerType: 'touch' }); await h.scroll(1200)
    await h.advance(46_000); assert.equal(h.state.opened, 0)
    await h.emit('pointerup'); await h.scroll(1400); await h.advance(2000); await h.scroll(1500)
    await h.advance(3000); assert.equal(h.state.opened, 0)
    await h.advance(500); assert.equal(h.state.opened, 1); assert.equal(h.trigger(), 'mobile_pause')
  } finally { await h.dispose() }
})

test('a silent decorative video does not cancel the invitation', async () => {
  const h = await setup()
  try {
    h.state.media = [{ muted: true, controls: false, paused: false, ended: false }]
    await h.emit('play'); await h.scroll(1200); await h.advance(45_000)
    assert.equal(h.state.opened, 1)
  } finally { await h.dispose() }
})

test('a foreground video postpones the invitation until playback ends and the visitor pauses', async () => {
  const h = await setup()
  try {
    h.state.media = [{ muted: true, controls: true, paused: false, ended: false }]
    await h.scroll(1200); await h.advance(50_000); assert.equal(h.state.opened, 0)
    h.state.media[0].ended = true; await h.emit('ended'); await h.advance(3000); assert.equal(h.state.opened, 0)
    await h.advance(500); assert.equal(h.state.opened, 1)
  } finally { await h.dispose() }
})

test('consent, form and other panels postpone rather than discard the invitation', async () => {
  const h = await setup()
  try {
    h.state.banner = 140; await h.scroll(1200); await h.advance(50_000); assert.equal(h.state.opened, 0)
    h.state.banner = 0; h.state.overlay = true; await h.advance(1000); assert.equal(h.state.opened, 0)
    h.state.overlay = false; h.document.activeElement = { closest: () => ({}) }
    await h.advance(1000); assert.equal(h.state.opened, 0)
    h.document.activeElement = null; await h.emit('focusout'); await h.advance(3500); assert.equal(h.state.opened, 1)
  } finally { await h.dispose() }
})

test('time in the background is excluded and a previously seen invitation stays closed', async () => {
  const h = await setup()
  try {
    await h.scroll(1200); await h.advance(10_000); await h.hidden(true); await h.advance(60_000)
    assert.equal(h.state.opened, 0)
    await h.hidden(false); await h.advance(34_500); assert.equal(h.state.opened, 0)
    await h.advance(500); assert.equal(h.state.opened, 1)
  } finally { await h.dispose() }
  const seen = await setup({ seen: true })
  try { await seen.scroll(1200); await seen.advance(90_000); assert.equal(seen.state.opened, 0) } finally { await seen.dispose() }
})

test('desktop keeps its exit trigger and navigating away cancels the mobile invitation', async () => {
  const desktop = await setup({ coarse: false })
  try {
    await desktop.scroll(1200); await desktop.advance(20_000); await desktop.leaveTop(); assert.equal(desktop.state.opened, 0)
    await desktop.advance(30_000); assert.equal(desktop.state.opened, 0)
    await desktop.leaveTop(); assert.equal(desktop.state.opened, 1); assert.equal(desktop.trigger(), 'desktop_exit')
  } finally { await desktop.dispose() }
  const mobile = await setup()
  try {
    await mobile.scroll(1200)
    await mobile.emit('click', { target: { closest: () => ({ getAttribute: () => '/tarifs3' }) } })
    await mobile.advance(90_000); assert.equal(mobile.state.opened, 0)
  } finally { await mobile.dispose() }
})
