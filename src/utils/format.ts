/** 千分位格式化 */
export function formatNum(n: number): string {
  return n.toLocaleString()
}

/** 公尺轉公里，保留一位小數 */
export function formatKm(m: number): string {
  return (m / 1000).toFixed(1)
}

/** 計分規則：每跑 1 公尺 = 1 分；每爬升 100 公尺 = 1 分 */
export function calcScore(distance: number, elevation: number): number {
  return distance + Math.floor(elevation / 100)
}
