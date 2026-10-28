import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Basecamp } from './basecamp.js'
import { config } from './config.js'
import { SCOPES, findScope, isHidden, publicDescription } from './scopes.js'

interface Person {
  id: number
  name: string
}

// Basecamp 2 event. The account-wide endpoint includes recurrences as separate occurrences.
interface CalendarEvent {
  /** missing on recurrence occurrences: use recurrence.master.id */
  id?: number
  bucket: { type: string; id: number; name: string }
  summary: string
  description: string | null
  all_day: boolean
  starts_at: string
  ends_at: string
  /** occurrences omit these three; they come from the master event */
  created_at?: string
  updated_at?: string
  subscribers?: Person[]
  private: boolean
  trashed: boolean
  recurrence?: { number: number; master: { id: number; url: string } }
}

/** The only shape that ever leaves this service. No Basecamp links, emails or internal people data. */
export interface PublicEvent {
  id: number
  scope: string
  group: string
  title: string
  description?: string
  allDay: boolean
  start: string
  end: string
  assigned?: string[]
  recurring: boolean
  createdAt: string
  updatedAt: string
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

async function main() {
  const bc = await Basecamp.load()

  const now = new Date()
  // Basecamp 2 rejects windows longer than 6 weeks, so fetch in 40-day chunks
  const events: CalendarEvent[] = []
  const seen = new Set<string>()
  const end = new Date(`${config.endDate()}T00:00:00Z`)
  for (let from = addDays(now, -config.pastDays()); from < end; from = addDays(from, 41)) {
    const to = addDays(from, 40)
    const chunk = await bc.listPages<CalendarEvent>('/calendar_events.json', {
      start_date: isoDate(from),
      end_date: isoDate(to < end ? to : end),
    })
    for (const e of chunk) {
      const key = `${e.id ?? e.recurrence?.master.id}|${e.starts_at}` // an event spanning a chunk boundary appears twice
      if (!seen.has(key)) {
        seen.add(key)
        events.push(e)
      }
    }
  }

  // recurrence occurrences carry no subscribers / timestamps: read them once from the master event
  const masters = new Map<number, CalendarEvent>()
  for (const e of events) {
    const m = e.recurrence?.master
    if (m && !masters.has(m.id)) masters.set(m.id, await bc.get<CalendarEvent>(m.url))
  }

  const out: PublicEvent[] = events
    // never publish private or deleted events on a public site
    .filter((e) => !e.private && !e.trashed)
    // only the scopes listed in scopes.ts are published
    .filter((e) => findScope(e.bucket.name))
    // internal items (payments, flights, rent...) listed in HIDE_TITLE_WORDS
    .filter((e) => !isHidden(e.summary))
    .map((e) => {
      const master = e.recurrence ? masters.get(e.recurrence.master.id) : undefined
      const src = { ...master, ...e }
      return { ...src, id: e.id ?? e.recurrence!.master.id, subscribers: e.subscribers ?? master?.subscribers ?? [] }
    })
    .map((e) => ({
      id: e.id,
      scope: findScope(e.bucket.name)!.label,
      group: findScope(e.bucket.name)!.group,
      title: e.summary,
      ...(config.includeDescription() && { description: publicDescription(e.description) }),
      allDay: e.all_day,
      start: e.starts_at,
      end: e.ends_at,
      ...(config.includeAssigned() && { assigned: e.subscribers.map((s) => s.name) }),
      recurring: Boolean(e.recurrence),
      createdAt: e.created_at ?? '',
      updatedAt: e.updated_at ?? '',
    }))
    .sort((a, b) => a.start.localeCompare(b.start))

  const skipped = new Set(events.filter((e) => !findScope(e.bucket.name)).map((e) => e.bucket.name))
  if (skipped.size) console.log(`Not published (not in scopes.ts): ${[...skipped].join(', ')}`)

  const latestUpdates = [...out].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20)

  const file = config.outputFile()
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await writeFile(tmp, JSON.stringify({ generatedAt: new Date().toISOString(), scopes: SCOPES.map(({ label, group }) => ({ label, group })), events: out, latestUpdates }, null, 2))
  await rename(tmp, file) // atomic: the site never reads a half-written file
  console.log(`Fetched ${events.length}, published ${out.length} events to ${file}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
