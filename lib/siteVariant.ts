export type SiteVariant = 'default' | 'rpg'

const DEFAULT_RPG_HOSTS = new Set(['rpg.dogeow.com', 'rpg.local.test'])

function getConfiguredHosts() {
  const configuredHosts = process.env.NEXT_PUBLIC_RPG_HOSTS

  if (!configuredHosts) {
    return DEFAULT_RPG_HOSTS
  }

  return new Set(
    configuredHosts
      .split(',')
      .map(host => host.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function normalizeHost(host: string | null | undefined) {
  return (host ?? '').split(':')[0].trim().toLowerCase()
}

export function resolveSiteVariant(host: string | null | undefined): SiteVariant {
  const hostname = normalizeHost(host)
  if (getConfiguredHosts().has(hostname)) {
    return 'rpg'
  }
  return 'default'
}
