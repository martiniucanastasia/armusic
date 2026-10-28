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
