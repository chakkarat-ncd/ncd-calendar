import { limitOf } from './constants'
import type { SheetRow } from './excel'
import { addDays, atMidnight, dateKey, daysBetween, keyToDate } from './date'

/** ยอดนัดของหนึ่งวัน */
export type DayCount = { key: string; date: Date; n: number }

/** ระดับสีของช่องปฏิทิน — เกณฑ์เดียวกับไฟล์ต้นแบบ */
export type Level = 'none' | 'ok' | 'warn' | 'bad'

/** ระดับสีของยอด n ในวันที่ date — เกณฑ์ต่างกันตามวันในสัปดาห์ */
export function levelOf(n: number, date: Date): Level {
  if (n === 0) return 'none'
  const { green, cap } = limitOf(date)
  if (n > cap) return 'bad'
  if (n > green) return 'warn'
  return 'ok'
}

/** ระดับสีของทั้งวัน */
export function levelOfDay(x: DayCount): Level {
  return levelOf(x.n, x.date)
}

/** รับได้อีกกี่ราย เทียบเพดานของวันนั้น ไม่ติดลบ */
export function remainingOf(x: DayCount): number {
  return Math.max(0, limitOf(x.date).cap - x.n)
}

/** เกินเพดานของวันนั้นไปกี่ราย ไม่ติดลบ */
export function overflowOf(x: DayCount): number {
  return Math.max(0, x.n - limitOf(x.date).cap)
}

/** แถวที่ส่งขึ้น Supabase — วันที่ + ชื่อคลินิก + จำนวน เท่านั้น */
export type CountRow = { d: string; c: string; n: number }

/** รวมยอดรายวันจากแถวในไฟล์ นับเฉพาะคลินิกที่ติ๊กไว้ */
export function tallyByDay(rows: SheetRow[], picked: Set<string>): Map<string, number> {
  const m = new Map<string, number>()
  rows.forEach((r) => {
    if (!picked.has(r.clinic)) return
    const k = dateKey(r.date)
    m.set(k, (m.get(k) ?? 0) + 1)
  })
  return m
}

/** รวมยอดรายวันจากยอดที่ดึงมาจาก Supabase ซึ่งแยกตามคลินิกอยู่แล้ว */
export function tallyRowsByDay(rows: CountRow[], picked?: Set<string>): Map<string, number> {
  const m = new Map<string, number>()
  rows.forEach((r) => {
    if (picked && !picked.has(r.c)) return
    m.set(r.d, (m.get(r.d) ?? 0) + r.n)
  })
  return m
}

/** ยุบเป็น วันที่ + คลินิก + จำนวน สำหรับส่งขึ้นระบบ นับเฉพาะตั้งแต่ from เป็นต้นไป */
export function toCountRows(
  rows: SheetRow[],
  picked: Set<string>,
  from: Date,
): CountRow[] {
  const start = atMidnight(from).getTime()
  const m = new Map<string, CountRow>()
  rows.forEach((r) => {
    if (!picked.has(r.clinic)) return
    if (r.date.getTime() < start) return
    const d = dateKey(r.date)
    const k = d + '\u0000' + r.clinic
    const hit = m.get(k)
    if (hit) hit.n++
    else m.set(k, { d, c: r.clinic, n: 1 })
  })
  return [...m.values()].sort((a, b) => (a.d === b.d ? a.c.localeCompare(b.c, 'th') : a.d < b.d ? -1 : 1))
}

/** วันสุดท้ายที่มีนัดในชุดข้อมูล */
export function maxDateOf(keys: Iterable<string>): Date | null {
  let max: string | null = null
  for (const k of keys) if (max === null || k > max) max = k
  return max === null ? null : keyToDate(max)
}

/** เพดานของช่วง "ทั้งหมด" กันไม่ให้วันที่เพี้ยนสักแถวลากปฏิทินยาวจนเบราว์เซอร์ค้าง */
export const MAX_ALL_DAYS = 1095

/**
 * แปลงตัวเลือกช่วงเป็นจำนวนวันจริง
 * 'ทั้งหมด' = นับถึงวันสุดท้ายที่มีนัด แต่อย่างน้อย 1 วัน และไม่เกิน 3 ปี
 */
export function resolveDays(
  range: number | 'all',
  from: Date,
  lastDate: Date | null,
): number {
  if (range !== 'all') return range
  if (!lastDate) return 1
  return Math.min(MAX_ALL_DAYS, Math.max(1, daysBetween(from, lastDate) + 1))
}

/** ไล่วันตั้งแต่ from ไปข้างหน้า days วัน พร้อมยอดของแต่ละวัน */
export function buildDayList(counts: Map<string, number>, from: Date, days: number): DayCount[] {
  const list: DayCount[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i)
    const key = dateKey(date)
    list.push({ key, date, n: counts.get(key) ?? 0 })
  }
  return list
}

export type Summary = {
  /** วันที่มีนัดในช่วงที่แสดง */
  has: DayCount[]
  /** เกินเพดานของวันนั้น */
  over: DayCount[]
  /** ใกล้เต็ม อยู่ระหว่างเกณฑ์เขียวกับเพดานของวันนั้น */
  near: DayCount[]
  /** ยังรับได้สบาย ไม่เกินเกณฑ์เขียวของวันนั้น */
  free: DayCount[]
  /** วันที่ยังรับนัดเพิ่มได้ คือยังไม่เกินเพดานของวันนั้น */
  available: DayCount[]
  total: number
}

/**
 * ทุกกลุ่มแยกด้วย levelOf ตัวเดียวกับที่ระบายสีปฏิทิน
 * ตัวเลขสรุปกับสีในปฏิทินจึงตรงกันเสมอ แม้เกณฑ์ของแต่ละวันจะต่างกัน
 */
export function summarize(list: DayCount[]): Summary {
  const has = list.filter((x) => x.n > 0)
  const at = new Map(has.map((x) => [x.key, levelOfDay(x)]))
  return {
    has,
    over: has.filter((x) => at.get(x.key) === 'bad'),
    near: has.filter((x) => at.get(x.key) === 'warn'),
    free: has.filter((x) => at.get(x.key) === 'ok'),
    available: has.filter((x) => at.get(x.key) !== 'bad'),
    total: has.reduce((s, x) => s + x.n, 0),
  }
}

/** จำนวนนัดที่อยู่เลยช่วงที่กำลังแสดง ใช้เตือนให้กด "ทั้งหมด" */
export function countBeyond(counts: Map<string, number>, end: Date): number {
  const endKey = dateKey(end)
  let n = 0
  counts.forEach((v, k) => {
    if (k > endKey) n += v
  })
  return n
}
