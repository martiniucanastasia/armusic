const TZ = 'America/Mexico_City'
const PALETTE = ['#4f9be0', '#2bb3c0', '#7b8cf0', '#39b58a', '#5bc0de', '#3f7fbf', '#8fa6e8', '#6cc3a9', '#a58be0', '#f0a860', '#6aa7d8']

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }) // YYYY-MM-DD
const timeFmt = new Intl.DateTimeFormat('es-MX', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
const longDayFmt = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const monthFmt = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', month: 'long', year: 'numeric' })
const rel = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const $ = (id) => document.getElementById(id)
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props)
  n.append(...kids)
  return n
}

const dayKey = (iso, allDay) => (allDay && /^\d{4}-\d\d-\d\d$/.test(iso) ? iso : dayFmt.format(new Date(iso)))
const keyToDate = (k) => new Date(`${k}T00:00:00Z`)
const dateToKey = (d) => d.toISOString().slice(0, 10)

function ago(iso) {
  const mins = Math.round((new Date(iso) - Date.now()) / 60000)
  if (Math.abs(mins) < 60) return rel.format(mins, 'minute')
  if (Math.abs(mins) < 1440) return rel.format(Math.round(mins / 60), 'hour')
  return rel.format(Math.round(mins / 1440), 'day')
}

const state = { data: null, active: new Set(), selected: null, year: 0, month: 0, colors: new Map(), byDay: new Map() }

function indexEvents() {
  state.byDay.clear()
  for (const e of state.data.events) {
    if (!state.active.has(e.scope)) continue
    const start = dayKey(e.start, e.allDay)
    let end = dayKey(e.end, e.allDay)
    if (end < start) end = start
    for (let d = keyToDate(start), i = 0; dateToKey(d) <= end && i < 60; d = new Date(d.getTime() + 864e5), i++) {
      const k = dateToKey(d)
      if (!state.byDay.has(k)) state.byDay.set(k, [])
      state.byDay.get(k).push(e)
    }
  }
}

const color = (scope) => state.colors.get(scope) ?? '#888'
const timeLabel = (e) => (e.allDay ? 'Todo el día' : timeFmt.format(new Date(e.start)))

function itemNode(e) {
  const meta = `${timeLabel(e)} · ${e.scope}${e.assigned?.length ? ' · ' + e.assigned.join(', ') : ''}`
  const item = el('div', { className: 'item' }, el('b', { textContent: e.title }))
  if (e.description) item.append(el('p', { className: 'desc', textContent: e.description }))
  item.append(el('span', { textContent: meta }))
  item.style.setProperty('--c', color(e.scope))
  return item
}

function renderGrid() {
  const { year, month } = state
  $('month').textContent = monthFmt.format(new Date(Date.UTC(year, month, 1)))
  const grid = $('grid')
  grid.replaceChildren(...['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => el('div', { className: 'dow', textContent: d })))
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7 // week starts Monday
  const today = dayFmt.format(new Date())
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(year, month, 1 - offset + i))
    const k = dateToKey(d)
    const evs = state.byDay.get(k) ?? []
    const cell = el('button', { className: 'day', type: 'button' }, el('span', { className: 'n', textContent: String(d.getUTCDate()) }))
    if (d.getUTCMonth() !== month) cell.classList.add('out')
    if (k === today) cell.classList.add('today')
    if (k === state.selected) cell.classList.add('sel')
    for (const e of evs.slice(0, 2)) {
      const chip = el('span', { className: 'ev', textContent: e.title })
      chip.style.setProperty('--c', color(e.scope))
      cell.append(chip)
    }
    if (evs.length > 2) cell.append(el('span', { className: 'more', textContent: `+${evs.length - 2} más` }))
    if (evs.length) {
      const dots = el('div', { className: 'dots' })
      for (const e of evs.slice(0, 4)) {
        const dot = el('i')
        dot.style.setProperty('--c', color(e.scope))
        dots.append(dot)
      }
      cell.append(dots)
    }
    cell.onclick = () => {
      state.selected = state.selected === k ? null : k
      render()
    }
    grid.append(cell)
  }
}

function renderAgenda() {
  const box = $('agenda')
  box.replaceChildren()
  // no month-wide listing: details only appear for a day the visitor clicks
  if (!state.selected) return
  for (const k of [state.selected]) {
    const evs = (state.byDay.get(k) ?? []).slice().sort((a, b) => a.start.localeCompare(b.start))
    box.append(el('h4', { textContent: longDayFmt.format(keyToDate(k)) }))
    if (!evs.length) box.append(el('p', { className: 'muted', textContent: 'Sin eventos.' }))
    evs.forEach((e) => box.append(itemNode(e)))
  }
}

function render() {
  renderGrid()
  renderAgenda()
}

async function main() {
  try {
    const res = await fetch('calendar.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(res.status)
    state.data = await res.json()
  } catch {
    $('agenda').append(el('p', { className: 'muted', textContent: 'No se pudo cargar el calendario. Intenta más tarde.' }))
    return
  }
  state.data.scopes.forEach((s, i) => state.colors.set(s.label, PALETTE[i % PALETTE.length]))
  state.data.scopes.forEach((s) => state.active.add(s.label))
  const now = new Date()
  const [y, m] = dayFmt.format(now).split('-').map(Number)
  state.year = y
  state.month = m - 1
  const step = (n) => {
    const d = new Date(Date.UTC(state.year, state.month + n, 1))
    state.year = d.getUTCFullYear()
    state.month = d.getUTCMonth()
    state.selected = null
    render()
  }
  $('prev').onclick = () => step(-1)
  $('next').onclick = () => step(1)
  indexEvents()
  render()
}

main()
