export function formatMass(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(3)} kg`
  return `${grams.toFixed(2)} g`
}

export function formatStiffness(gpa: number): string {
  if (gpa < 1) return `${(gpa * 1000).toFixed(0)} MPa`
  return `${gpa.toFixed(2)} GPa`
}

export function formatStrength(mpa: number): string {
  return `${mpa.toFixed(1)} MPa`
}

export function formatDensity(rel: number): string {
  return `${(rel * 100).toFixed(1)}%`
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
