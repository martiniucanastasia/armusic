function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var ${name} (see .env.example)`)
  return v
}

const flag = (name: string, fallback: boolean) =>
  process.env[name] === undefined ? fallback : process.env[name] === 'true'

export const config = {
  clientId: () => required('BASECAMP_CLIENT_ID'),
  clientSecret: () => required('BASECAMP_CLIENT_SECRET'),
  redirectUri: () => process.env.BASECAMP_REDIRECT_URI ?? 'http://localhost:4567/callback',
  accountId: () => required('BASECAMP_ACCOUNT_ID'),
  userAgent: () => required('BASECAMP_USER_AGENT'),
  pastDays: () => Number(process.env.PAST_DAYS ?? 30),
  futureDays: () => Number(process.env.FUTURE_DAYS ?? 365),
  includeDescription: () => flag('INCLUDE_DESCRIPTION', false),
  includeAssigned: () => flag('INCLUDE_ASSIGNED', true),
  outputFile: () => process.env.OUTPUT_FILE ?? 'out/calendar.json',
  tokenFile: () => process.env.TOKEN_FILE ?? '.tokens.json',
}
