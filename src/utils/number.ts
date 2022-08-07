/**
 * 100 => 100
 * 1100 => 1.1K
 * 11000 => 10K
 * 1100000 => 1.1M
 * 1000000000 => 1B
 * 1100000000 => 1.1B
 */
export const formatNumber = (number: number) => {
  const len = String(number).length

  if (len < 4) {
    return number
  }

  if (len < 7) {
    return `${(number / 1000).toFixed(1)}K`
  }

  if (len < 10) {
    return `${(number / 1000000).toFixed(1)}M`
  }

  return `${(number / 1000000000).toFixed(1)}B`
}
