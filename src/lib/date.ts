import { TH_M, TH_M_FULL, TH_D } from './constants'

/** ตัดเวลาออก เหลือแต่วันที่ตามเวลาเครื่อง */
export function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function today(): Date {
  return atMidnight(new Date())
}

/** คีย์รูปแบบ YYYY-MM-DD ตามเวลาเครื่อง — ใช้เป็นทั้งคีย์ในหน่วยความจำและค่าที่ส่งขึ้น Supabase */
export function dateKey(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

/** แปลงคีย์ YYYY-MM-DD กลับเป็น Date ตามเวลาเครื่อง (ไม่ผ่าน UTC เพื่อไม่ให้วันเคลื่อน) */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** จำนวนวันจาก a ถึง b แบบนับรวมวันแรก */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((atMidnight(b).getTime() - atMidnight(a).getTime()) / 86400000)
}

/**
 * แปลงค่าจากเซลล์เป็นวันที่ — ตรรกะเดียวกับไฟล์ต้นแบบ
 * รองรับ Excel serial, Date object, d/m/yyyy และ yyyy-m-d
 * ถ้าปี > 2400 ถือว่าเป็น พ.ศ. ให้ลบ 543 (HosXP บางเครื่อง export มาเป็น พ.ศ.)
 */
export function parseDate(v: unknown): Date | null {
  if (v == null || v === '') return null

  if (v instanceof Date && !isNaN(v.getTime())) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate())
  }

  // Excel serial number — ช่วงเดียวกับต้นแบบ กันไม่ให้ HN หรือเลขอื่นถูกอ่านเป็นวันที่
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    return excelSerialToDate(v)
  }

  const s = String(v).trim()

  // ตัวเลขล้วนที่ไม่เข้าช่วง Excel serial ข้างบน มักเป็น HN หรือรหัสอื่นที่หลุดมา
  // ถ้าปล่อยผ่าน new Date('123456') จะอ่านเป็นปี ค.ศ. 123456 แล้วปฏิทินจะยาวเป็นแสนปี
  if (/^\d+$/.test(s)) return null

  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (m) {
    let y = +m[3]
    if (y > 2400) y -= 543
    return sane(new Date(y, +m[2] - 1, +m[1]))
  }

  m = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (m) {
    let y = +m[1]
    if (y > 2400) y -= 543
    return sane(new Date(y, +m[2] - 1, +m[3]))
  }

  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return sane(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
}

/** ปีที่ยอมรับได้ — กันวันที่เพี้ยนจากเซลล์ที่ไม่ใช่วันที่จริง ไม่ให้ปฏิทินยาวผิดปกติ */
function sane(d: Date): Date | null {
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  return y >= 1900 && y <= 2200 ? d : null
}

/** Excel นับวันที่ 1 = 1 ม.ค. 1900 โดยมีบั๊กปี 1900 เป็นปีอธิกสุรทิน จุดตั้งต้นจึงเป็น 30 ธ.ค. 1899 */
function excelSerialToDate(serial: number): Date | null {
  const ms = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000
  const u = new Date(ms)
  if (isNaN(u.getTime())) return null
  return sane(new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()))
}

/** 5 ก.ย. 68 — รูปแบบเดียวกับไฟล์ต้นแบบ */
export function fmt(d: Date): string {
  return d.getDate() + ' ' + TH_M[d.getMonth()] + ' ' + String(d.getFullYear() + 543).slice(-2)
}

/** 5 กันยายน 2568 */
export function fmtFull(d: Date): string {
  return d.getDate() + ' ' + TH_M_FULL[d.getMonth()] + ' ' + (d.getFullYear() + 543)
}

/** 5 ก.ย. 68 เวลา 14:32 น. */
export function fmtDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${fmt(d)} เวลา ${hh}:${mm} น.`
}

export function thaiDow(d: Date): string {
  return TH_D[d.getDay()]
}

/** จำนวนช่องว่างหน้าวันแรกของเดือน เมื่อปฏิทินเริ่มที่วันจันทร์ */
export function padBeforeMonday(d: Date): number {
  return (d.getDay() + 6) % 7
}
