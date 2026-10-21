import { createServer } from 'node:http'
import { config } from './config.js'
import { exchangeCode, fetchAccounts, saveTokens } from './basecamp.js'

// One-time local OAuth flow. Run it, open the printed URL, approve in Basecamp.
const redirect = new URL(config.redirectUri())

const authUrl = new URL('https://launchpad.37signals.com/authorization/new')
authUrl.search = new URLSearchParams({
  type: 'web_server',
  client_id: config.clientId(),
  redirect_uri: config.redirectUri(),
}).toString()

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', redirect.origin)
  if (url.pathname !== redirect.pathname) {
    res.writeHead(404).end()
    return
  }
  const code = url.searchParams.get('code')
  if (!code) {
    res.writeHead(400).end('Missing ?code')
    return
  }
  try {
    const tokens = await exchangeCode(code)
    await saveTokens(tokens)
    const { identity, accounts } = await fetchAccounts(tokens.access_token)
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Authorized. You can close this tab.')
    console.log(`\nAuthorized as ${identity.email_address}. Tokens saved to ${config.tokenFile()}.`)
    console.log('Set BASECAMP_ACCOUNT_ID to one of:')
    for (const a of accounts) console.log(`  ${a.id}  ${a.name}  (${a.product})`)
  } catch (e) {
    res.writeHead(500).end('Auth failed, see terminal')
    console.error(e)
  } finally {
    server.close()
  }
})

server.listen(Number(redirect.port) || 80, () => {
  console.log(`Open this URL in your browser:\n\n  ${authUrl}\n`)
})
