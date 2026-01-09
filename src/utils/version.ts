export function isNewerVersion(current: string, latest: string): boolean {
  const cleanCurrent = current.replace(/^v/, '')
  const cleanLatest = latest.replace(/^v/, '')
  const [currentBase, currentPre] = splitVersion(cleanCurrent)
  const [latestBase, latestPre] = splitVersion(cleanLatest)
  const currentParts = currentBase.split('.').map(Number)
  const latestParts = latestBase.split('.').map(Number)

  const maxLength = Math.max(currentParts.length, latestParts.length)
  for (let i = 0; i < maxLength; i++) {
    const currentPart = currentParts[i] || 0
    const latestPart = latestParts[i] || 0

    if (latestPart > currentPart) return true
    if (latestPart < currentPart) return false
  }

  if (!latestPre && currentPre) return true
  if (latestPre && !currentPre) return false

  if (latestPre && currentPre) {
    return comparePrereleaseVersion(currentPre, latestPre)
  }

  return false
}

function splitVersion(version: string): [string, string] {
  const hyphenIndex = version.indexOf('-')
  if (hyphenIndex === -1) {
    return [version, '']
  }
  return [version.substring(0, hyphenIndex), version.substring(hyphenIndex + 1)]
}

function comparePrereleaseVersion(current: string, latest: string): boolean {
  const order = ['alpha', 'beta', 'rc']

  const currentType = order.find((type) => current.startsWith(type))
  const latestType = order.find((type) => latest.startsWith(type))

  if (currentType && latestType && currentType !== latestType) {
    return order.indexOf(latestType) > order.indexOf(currentType)
  }

  const currentNum = extractNumber(current)
  const latestNum = extractNumber(latest)

  if (currentNum !== null && latestNum !== null) {
    return latestNum > currentNum
  }

  return latest > current
}

function extractNumber(str: string): number | null {
  const match = str.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}
