import * as XLSX from 'xlsx'
import { NCD_CLINICS } from './constants'
import { parseDate } from './date'

/** หนึ่งแถวหลังกลั่นแล้ว — มีแค่ชื่อคลินิกกับวันที่นัด ไม่มีชื่อผู้ป่วยหรือ HN ติดมาด้วย */
export type SheetRow = { clinic: string; date: Date }

export type ClinicTally = { name: string; n: number }

export type ParseResult = {
  fileName: string
  sheetName: string
  columns: string[]
  clinicColumn: string
  dateColumn: string
  rows: SheetRow[]
  /** คลินิกทุกชื่อที่พบในไฟล์ พร้อมจำนวนแถว เรียงจากมากไปน้อย */
  clinics: ClinicTally[]
  /** คลินิก NCD ที่ควรมีแต่ไม่พบในไฟล์ */
  ncdMissing: string[]
  /** แถวที่อ่านวันที่ไม่ได้ จึงไม่ถูกนับ */
  badDateCount: number
  /** แถวที่ไม่มีชื่อคลินิก จึงไม่ถูกนับ */
  emptyClinicCount: number
}

/** ข้อผิดพลาดที่อธิบายได้ว่าเกิดอะไรและต้องทำอะไรต่อ */
export class SheetError extends Error {
  detail: string
  columns?: string[]
  constructor(message: string, detail: string, columns?: string[]) {
    super(message)
    this.name = 'SheetError'
    this.detail = detail
    this.columns = columns
  }
}

export const norm = (s: unknown): string =>
  String(s == null ? '' : s).replace(/\s+/g, ' ').trim()

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () =>
      reject(
        new SheetError(
          'อ่านไฟล์ไม่สำเร็จ',
          'เบราว์เซอร์เปิดไฟล์นี้ไม่ได้ อาจถูกย้ายหรือถูกโปรแกรมอื่นล็อกไว้อยู่ — ปิดไฟล์ใน Excel แล้วบันทึกเป็น .xlsx อีกครั้ง จากนั้นเลือกไฟล์ใหม่',
        ),
      )
    r.onload = (e) => resolve(e.target!.result as ArrayBuffer)
    r.readAsArrayBuffer(file)
  })
}

/**
 * อ่านไฟล์นัดจาก HosXP ในเบราว์เซอร์
 * คืนเฉพาะชื่อคลินิกกับวันที่นัด คอลัมน์อื่นในไฟล์ถูกทิ้งทั้งหมดตั้งแต่ขั้นนี้
 */
export async function readAppointmentFile(
  file: File,
  expected: readonly string[] = NCD_CLINICS,
): Promise<ParseResult> {
  const buf = await readAsArrayBuffer(file)

  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buf, { type: 'array', cellDates: true })
  } catch {
    throw new SheetError(
      'เปิดไฟล์นี้ไม่ได้',
      'ไฟล์อาจเสียหาย หรือยังอยู่ในโหมดมุมมองที่ได้รับการป้องกัน — เปิดใน Excel กด "เปิดใช้งานการแก้ไข" แล้วบันทึกเป็น .xlsx ก่อน',
    )
  }

  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    throw new SheetError(
      'ไฟล์นี้ไม่มีแผ่นงาน',
      'เปิดไฟล์ใน Excel เพื่อตรวจว่ามีข้อมูลอยู่จริง แล้ว export จาก HosXP ใหม่อีกครั้ง',
    )
  }

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
    defval: '',
  })
  if (!data.length) {
    throw new SheetError(
      'ไฟล์นี้ไม่มีข้อมูล',
      'แผ่นงานแรกว่างเปล่า — ตรวจว่าบันทึกไฟล์หลังจาก export จาก HosXP แล้วหรือยัง',
    )
  }

  // จับคู่ชื่อคอลัมน์ที่ตัดช่องว่างแล้วกลับไปหาคีย์จริงในแถว เผื่อหัวตารางมีช่องว่างเกิน
  const rawKeys = Object.keys(data[0])
  const byNorm = new Map<string, string>()
  rawKeys.forEach((k) => {
    const n = norm(k)
    if (!byNorm.has(n)) byNorm.set(n, k)
  })
  const columns = [...byNorm.keys()]

  const clinicCol =
    columns.find((c) => c === 'คลินิก') ?? columns.find((c) => c.includes('คลินิก'))
  const dateCol =
    columns.find((c) => c === 'วันที่นัด') ??
    columns.find((c) => c.includes('วันที่นัด')) ??
    columns.find((c) => c.includes('วันนัด'))

  if (!clinicCol || !dateCol) {
    const missing = [!clinicCol && 'คลินิก', !dateCol && 'วันที่นัด'].filter(Boolean)
    throw new SheetError(
      `ไม่พบคอลัมน์ ${missing.join(' และ ')} ในไฟล์`,
      'ระบบต้องใช้คอลัมน์ คลินิก และ วันที่นัด — ตอน export จาก HosXP ให้เลือกสองคอลัมน์นี้มาด้วย หรือแก้ชื่อหัวตารางในไฟล์ให้ตรง แล้วเลือกไฟล์ใหม่',
      columns,
    )
  }

  const clinicKey = byNorm.get(clinicCol)!
  const dateKeyCol = byNorm.get(dateCol)!

  const rows: SheetRow[] = []
  let badDateCount = 0
  let emptyClinicCount = 0

  data.forEach((o) => {
    const clinic = norm(o[clinicKey])
    if (!clinic) {
      emptyClinicCount++
      return
    }
    const date = parseDate(o[dateKeyCol])
    if (!date) {
      badDateCount++
      return
    }
    rows.push({ clinic, date })
  })

  if (!rows.length) {
    throw new SheetError(
      'อ่านข้อมูลในไฟล์ไม่ได้เลย',
      `พบ ${data.length.toLocaleString()} แถว แต่แปลงเป็นวันที่นัดไม่ได้สักแถว — เปิดคอลัมน์ "${dateCol}" ใน Excel เพื่อตรวจรูปแบบวันที่ ควรเป็นวันที่จริงหรือข้อความแบบ 5/9/2568`,
      columns,
    )
  }

  const counts = new Map<string, number>()
  rows.forEach((r) => counts.set(r.clinic, (counts.get(r.clinic) ?? 0) + 1))
  const clinics: ClinicTally[] = [...counts.entries()]
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'th'))

  const found = new Set(counts.keys())
  const ncdMissing = expected.filter((c) => !found.has(c))

  return {
    fileName: file.name,
    sheetName,
    columns,
    clinicColumn: clinicCol,
    dateColumn: dateCol,
    rows,
    clinics,
    ncdMissing,
    badDateCount,
    emptyClinicCount,
  }
}

/**
 * คลินิกที่พบจริงในไฟล์และอยู่ในรายชื่อที่ควรนับ ใช้ติ๊กเลือกให้อัตโนมัติ
 * expected มาจากตาราง clinic_config ถ้าต่อฐานข้อมูลได้ ไม่งั้นใช้รายชื่อสำรองในโค้ด
 */
export function defaultPicked(
  clinics: ClinicTally[],
  expected: readonly string[] = NCD_CLINICS,
): Set<string> {
  const want = new Set<string>(expected)
  return new Set(clinics.filter((c) => want.has(c.name)).map((c) => c.name))
}
