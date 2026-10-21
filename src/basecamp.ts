import { readFile, writeFile } from 'node:fs/promises'
import { config } from './config.js'

const LAUNCHPAD = 'https://launchpad.37signals.com'

export interface Tokens {
  access_token: string
  refresh_token: string
  /** epoch ms */
  expires_at: number
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export async function saveTokens(t: Tokens) {
  await writeFile(config.tokenFile(), JSON.stringify(t, null, 2), { mode: 0o600 })
}

export function tokensFromResponse(r: TokenResponse, previousRefresh?: string): Tokens {
  const refresh = r.refresh_token ?? previousRefresh
  if (!refresh) throw new Error('Token response had no refresh_token')
  return {
    access_token: r.access_token,
    refresh_token: refresh,
    // refresh a minute early
    expires_at: Date.now() + r.expires_in * 1000 - 60_000,
  }
}

export async function exchangeCode(code: string): Promise<Tokens> {
  const url = new URL(`${LAUNCHPAD}/authorization/token`)
  url.search = new URLSearchParams({
    type: 'web_server',
    client_id: config.clientId(),
    client_secret: config.clientSecret(),
    redirect_uri: config.redirectUri(),
    code,
  }).toString()
  const res = await fetch(url, { method: 'POST', headers: { 'User-Agent': config.userAgent() } })
  if (!res.ok) throw new Error(`Code exchange failed: ${res.status} ${await res.text()}`)
  return tokensFromResponse((await res.json()) as TokenResponse)
}

async function refresh(old: Tokens): Promise<Tokens> {
  const url = new URL(`${LAUNCHPAD}/authorization/token`)
  url.search = new URLSearchParams({
    type: 'refresh',
    client_id: config.clientId(),
    client_secret: config.clientSecret(),
    refresh_token: old.refresh_token,
  }).toString()
  const res = await fetch(url, { method: 'POST', headers: { 'User-Agent': config.userAgent() } })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}. Re-run \`npm run auth\`.`)
  const next = tokensFromResponse((await res.json()) as TokenResponse, old.refresh_token)
  await saveTokens(next)
  return next
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class Basecamp {
  private constructor(private tokens: Tokens) {}

  static async load(): Promise<Basecamp> {
    try {
      return new Basecamp(JSON.parse(await readFile(config.tokenFile(), 'utf8')) as Tokens)
    } catch {
      // CI has no token file: start from the stored refresh token and mint a fresh access token
      const refreshToken = process.env.BASECAMP_REFRESH_TOKEN
      if (refreshToken) return new Basecamp({ access_token: '', refresh_token: refreshToken, expires_at: 0 })
      throw new Error(`No ${config.tokenFile()} found. Run \`npm run auth\` first.`)
    }
  }

  private async accessToken() {
    if (Date.now() >= this.tokens.expires_at) this.tokens = await refresh(this.tokens)
    return this.tokens.access_token
  }

  private resolve(path: string) {
    // Basecamp 2 ("bcx") API
    return path.startsWith('http') ? path : `https://basecamp.com/${config.accountId()}/api/v1${path}`
  }

  /** GET with auth, User-Agent, and retry on 429 / 5xx. */
  private async request(path: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(this.resolve(path), {
        headers: {
          Authorization: `Bearer ${await this.accessToken()}`,
          'User-Agent': config.userAgent(),
          Accept: 'application/json',
        },
      })
      if (res.ok) return res
      const retryable = res.status === 429 || res.status >= 500
      if (!retryable || attempt >= 4) {
        throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`)
      }
      const wait = Number(res.headers.get('Retry-After')) * 1000 || 2 ** attempt * 1000
      await sleep(wait)
    }
  }

  /** Follows `Link: <...>; rel="next"` pagination and returns every item. */
  async list<T>(path: string): Promise<T[]> {
    const out: T[] = []
    let next: string | undefined = path
    while (next) {
      const res = await this.request(next)
      out.push(...((await res.json()) as T[]))
      const m = res.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/)
      next = m?.[1]
    }
    return out
  }

  /** Basecamp 2 pages with `?page=N` (50 per page); stops at the first empty page. */
  async listPages<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const out: T[] = []
    for (let page = 1; ; page++) {
      const qs = new URLSearchParams({ ...params, page: String(page) })
      const items = (await (await this.request(`${path}?${qs}`)).json()) as T[]
      if (!items.length) return out
      out.push(...items)
    }
  }

  async get<T>(path: string): Promise<T> {
    return (await (await this.request(path)).json()) as T
  }
}

/** Launchpad: which Basecamp accounts the token can reach (used by `npm run auth`). */
export async function fetchAccounts(accessToken: string) {
  const res = await fetch(`${LAUNCHPAD}/authorization.json`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': config.userAgent() },
  })
  if (!res.ok) throw new Error(`authorization.json failed: ${res.status}`)
  const body = (await res.json()) as {
    identity: { email_address: string }
    accounts: { id: number; name: string; product: string }[]
  }
  return { ...body, accounts: body.accounts.filter((a) => a.product === 'bcx') }
}
