import { Activity, RacePrediction } from '@/types'

const RACE_DISTANCES = [
  { distance_km: 5, label: '5K', minKm: 3, maxKm: 7 },
  { distance_km: 10, label: '10K', minKm: 7, maxKm: 15 },
  { distance_km: 21.0975, label: 'Half Marathon', minKm: 14, maxKm: 30 },
  { distance_km: 42.195, label: 'Marathon', minKm: 25, maxKm: Infinity },
]

export function riegelPredict(t1Seconds: number, d1Km: number, d2Km: number, exponent = 1.06): number {
  return t1Seconds * Math.pow(d2Km / d1Km, exponent)
}

// Derive a personal fatigue exponent from actual race results.
// Requires at least two races at different distances.
// Formula: exponent = log(T2/T1) / log(D2/D1)
function getPersonalExponent(activities: Activity[]): number {
  const races = activities
    .filter((a) => a.workout_type === 1 && a.distance >= 3000 && a.moving_time > 0)
    .sort((a, b) => a.distance - b.distance)

  if (races.length < 2) return 1.06

  // Use fastest at each distinct distance bracket, then pick two furthest apart
  const shortest = races[0]
  const longest = races[races.length - 1]

  const d1 = shortest.distance / 1000
  const d2 = longest.distance / 1000
  const t1 = shortest.moving_time
  const t2 = longest.moving_time

  if (d1 === d2) return 1.06

  const exponent = Math.log(t2 / t1) / Math.log(d2 / d1)
  // Clamp to a sane range — anything outside this is a data anomaly
  return Math.min(Math.max(exponent, 1.0), 1.15)
}

// For a given target distance, find the best reference run.
// Priority: 1) races in bracket, 2) fastest-pace run in bracket, 3) fastest-pace run overall
function getBestReference(activities: Activity[], minKm: number, maxKm: number): Activity | null {
  const eligible = activities.filter(
    (a) => a.distance / 1000 >= minKm && a.distance / 1000 <= maxKm && a.moving_time > 0
  )

  if (!eligible.length) {
    // Fall back to fastest-pace run from anything ≥3km
    const fallback = activities
      .filter((a) => a.distance >= 3000 && a.moving_time > 0)
      .sort((a, b) => b.average_speed - a.average_speed)
    return fallback[0] ?? null
  }

  // Prefer race-effort runs; within that, pick fastest pace
  const races = eligible.filter((a) => a.workout_type === 1)
  const pool = races.length ? races : eligible
  return pool.sort((a, b) => b.average_speed - a.average_speed)[0]
}

export function getPredictions(activities: Activity[]): RacePrediction[] {
  if (!activities.length) return []

  const exponent = getPersonalExponent(activities)

  return RACE_DISTANCES.map(({ distance_km, label, minKm, maxKm }) => {
    const ref = getBestReference(activities, minKm, maxKm)
    if (!ref) return { distance_km, label, predicted_seconds: 0 }

    const refKm = ref.distance / 1000
    const predicted = riegelPredict(ref.moving_time, refKm, distance_km, exponent)
    return { distance_km, label, predicted_seconds: Math.round(predicted) }
  }).filter((p) => p.predicted_seconds > 0)
}

// For the improvement graph: track the best predicted time up to each run date
export function getPredictionHistory(
  activities: Activity[],
  targetDistanceKm: number
): { date: string; predicted_seconds: number }[] {
  const target = RACE_DISTANCES.find((d) => d.distance_km === targetDistanceKm)
  const minKm = target?.minKm ?? 3
  const maxKm = target?.maxKm ?? Infinity

  const sorted = [...activities]
    .filter((a) => a.distance >= 3000 && a.moving_time > 0)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const exponent = getPersonalExponent(activities)
  const history: { date: string; predicted_seconds: number }[] = []
  let bestPrediction = Infinity

  for (const activity of sorted) {
    const refKm = activity.distance / 1000
    const predicted = riegelPredict(activity.moving_time, refKm, targetDistanceKm, exponent)

    // Only plot a point when this run is within the bracket and improves the prediction
    const inBracket = refKm >= minKm && refKm <= maxKm
    if (inBracket && predicted < bestPrediction) {
      bestPrediction = predicted
      history.push({
        date: activity.start_date.split('T')[0],
        predicted_seconds: Math.round(predicted),
      })
    }
  }

  return history
}
