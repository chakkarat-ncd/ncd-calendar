import { describe, expect, it } from 'vitest'
import { MAX_ALL_DAYS, endOfMonth, resolveDays } from './counts'
import { addDays } from './date'

/** วันสุดท้ายที่ปฏิทินจะแสดง เมื่อเริ่มจาก from และแสดง days วัน */
const lastShown = (from: Date, days: number) => addDays(from, days - 1)
// ปี ค.ศ. — 2569 = 2026, 2570 = 2027 · เดือนนับจาก 0
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day)

describe('resolveDays นับเป็นเดือน และแสดงเดือนสุดท้ายจนครบ', () => {
  it('23 พ.ย. 2569 + 3 เดือน สิ้นสุด 31 ม.ค. 2570', () => {
    const from = d(2026, 11, 23)
    expect(lastShown(from, resolveDays(3, from, null))).toEqual(d(2027, 1, 31))
  })

  it('23 พ.ย. 2569 + 6 เดือน สิ้นสุด 30 เม.ย. 2570 (159 วัน)', () => {
    const from = d(2026, 11, 23)
    const days = resolveDays(6, from, null)
    expect(lastShown(from, days)).toEqual(d(2027, 4, 30))
    expect(days).toBe(159)
  })

  it('31 ม.ค. 2570 + 3 เดือน สิ้นสุด 31 มี.ค. 2570 (ไม่ล้นแบบ setMonth)', () => {
    const from = d(2027, 1, 31)
    expect(lastShown(from, resolveDays(3, from, null))).toEqual(d(2027, 3, 31))
  })

  it('15 ธ.ค. 2569 + 12 เดือน สิ้นสุด 30 พ.ย. 2570', () => {
    const from = d(2026, 12, 15)
    expect(lastShown(from, resolveDays(12, from, null))).toEqual(d(2027, 11, 30))
  })

  it("'all' ที่นัดสุดท้ายอยู่กลางเดือน ขยายถึงสิ้นเดือนนั้น", () => {
    const from = d(2026, 11, 23)
    const days = resolveDays('all', from, d(2027, 2, 14))
    expect(lastShown(from, days)).toEqual(d(2027, 2, 28))
  })

  it("'all' ยังไม่เกิน MAX_ALL_DAYS และไม่มีนัดเลยได้ 1 วัน", () => {
    const from = d(2026, 11, 23)
    expect(resolveDays('all', from, d(2035, 6, 15))).toBe(MAX_ALL_DAYS)
    expect(resolveDays('all', from, null)).toBe(1)
  })

  it('endOfMonth จากวันที่ 31 ไม่ข้ามเดือน', () => {
    expect(endOfMonth(d(2027, 1, 31), 1)).toEqual(d(2027, 2, 28))
    expect(endOfMonth(d(2028, 1, 31), 1)).toEqual(d(2028, 2, 29))
  })
})
