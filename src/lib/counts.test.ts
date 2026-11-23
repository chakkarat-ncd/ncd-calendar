import { describe, expect, it } from 'vitest'
import { MAX_ALL_DAYS, breakdownByDay, endOfMonth, resolveDays, tallyRowsByDay } from './counts'
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

describe('breakdownByDay', () => {
  const clinics = [
    { clinic_name: 'เบาหวาน', active_from: null, active_until: null },
    { clinic_name: 'ความดันโลหิตสูง', active_from: null, active_until: null },
    // ปิดสิ้นเดือน พ.ย. — เดือน ธ.ค. ต้องไม่ถูกนับ
    { clinic_name: 'วาร์ฟาริน', active_from: null, active_until: '2026-11-30' },
    // เริ่มเปิด ธ.ค. — เดือน พ.ย. ต้องไม่ถูกนับ
    { clinic_name: 'CKD', active_from: '2026-12-01', active_until: null },
  ]
  const rows = [
    { d: '2026-11-23', c: 'เบาหวาน', n: 30 },
    { d: '2026-11-23', c: 'ความดันโลหิตสูง', n: 30 },
    { d: '2026-11-23', c: 'วาร์ฟาริน', n: 12 },
    { d: '2026-11-23', c: 'CKD', n: 9 },
    { d: '2026-11-23', c: 'คลินิกที่ไม่อยู่ในรายชื่อ', n: 50 },
    { d: '2026-12-01', c: 'วาร์ฟาริน', n: 7 },
    { d: '2026-12-01', c: 'CKD', n: 20 },
    { d: '2026-12-01', c: 'เบาหวาน', n: 5 },
    { d: '2026-12-01', c: 'เบาหวาน', n: 3 },
    { d: '2026-12-02', c: 'วาร์ฟาริน', n: 4 },
  ]

  it('ผลรวมของแต่ละวันเท่ากับ tallyRowsByDay เสมอ', () => {
    const tally = tallyRowsByDay(rows, clinics)
    const br = breakdownByDay(rows, clinics)
    expect([...br.keys()].sort()).toEqual([...tally.keys()].sort())
    tally.forEach((n, key) => {
      expect(br.get(key)!.reduce((s, x) => s + x.n, 0)).toBe(n)
    })
  })

  it('เรียงมากไปน้อย ถ้าเท่ากันเรียงตามชื่อ และรวมแถวซ้ำของคลินิกเดียวกัน', () => {
    const br = breakdownByDay(rows, clinics)
    expect(br.get('2026-11-23')).toEqual([
      { clinic: 'ความดันโลหิตสูง', n: 30 },
      { clinic: 'เบาหวาน', n: 30 },
      { clinic: 'วาร์ฟาริน', n: 12 },
    ])
    expect(br.get('2026-12-01')).toEqual([
      { clinic: 'CKD', n: 20 },
      { clinic: 'เบาหวาน', n: 8 },
    ])
    // วันที่มีแต่คลินิกที่ปิดแล้ว ไม่มีในผลลัพธ์ เหมือน tallyRowsByDay
    expect(br.has('2026-12-02')).toBe(false)
  })
})
