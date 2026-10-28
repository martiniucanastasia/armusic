// Only these Basecamp projects/calendars are published, in this display order.
// `match` lists spellings seen in Basecamp; comparison ignores case, accents and punctuation.

export interface Scope {
  label: string
  group: 'projects' | 'armusic'
  match: string[]
}

export const SCOPES: Scope[] = [
  { label: 'armusic: Eventos', group: 'armusic', match: ['armusic', 'armusic: Eventos'] },
  { label: 'armusic: Citas / Zooms', group: 'armusic', match: ['armusic: Citas / Zooms'] },
  { label: 'armusic: Montajes Eventos', group: 'armusic', match: ['armusic: Montajes Eventos'] },
  { label: 'armusic: Scoutings', group: 'armusic', match: ['armusic: Scoutings'] },
  { label: 'armusic: Seguimientos y Contratos', group: 'armusic', match: ['ARMusic: Seguimientos y Contratos'] },
  { label: 'armusic: Staff', group: 'armusic', match: ['Equipo Alfa', 'armusic: Staff'] },

  { label: 'Frequency', group: 'projects', match: ['Frequency'] },
  { label: 'promusic', group: 'projects', match: ['PRo Rental', 'ProRental', 'promusic'] },
  { label: 'Terraza FE', group: 'projects', match: ['Terraza FE'] },
  { label: 'Vacaciones / Dias Feriados', group: 'projects', match: ['Vacaciones / Dias Feriados'] },
]

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const byName = new Map(SCOPES.flatMap((s) => s.match.map((m) => [norm(m), s] as const)))

/** Returns the allowed scope for a Basecamp bucket name, or undefined if it must not be published. */
export const findScope = (bucketName: string) => byName.get(norm(bucketName))

// Internal events: any title containing one of these words is never published.
// (comparison ignores case and accents)
export const HIDE_TITLE_WORDS = ['Pagar', 'Vuelo', 'Cobrar', 'Recoger dinero']

const lower = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const hideWords = HIDE_TITLE_WORDS.map(lower)
export const isHidden = (title: string) => hideWords.some((w) => lower(title).includes(w))

// Descriptions mentioning money or contracts are never published (the event itself still is).
const SENSITIVE = /\b(total|saldo|anticipo|contrato|usd|mxn|eur|pesos|dolares|precio|costo)\b|\$\s?\d/

/** Clean text for the public calendar, or undefined if there is nothing safe to show. */
export function publicDescription(raw: string | null | undefined): string | undefined {
  const text = (raw ?? '')
    .replace(/Add an optional note\s*$/i, '') // placeholder Basecamp leaves in the field
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
  if (!text || SENSITIVE.test(lower(text))) return undefined
  return text
}
