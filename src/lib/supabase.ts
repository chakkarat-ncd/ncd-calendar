import { createClient } from '@supabase/supabase-js'
import type { CountRow } from './counts'
import { dateKey, today } from './date'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** ถ้ายังไม่ได้ตั้งค่า .env จะไม่สร้าง client เลย เพื่อให้หน้าเว็บบอกสาเหตุได้ตรง ๆ */
export const supabaseConfigured = Boolean(url && publishableKey)

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, { auth: { persistSession: false } })
  : null

/** ข้อผิดพลาดที่บอกได้ว่าเกิดอะไรและต้องทำอะไรต่อ */
export class DataError extends Error {
  detail: string
  constructor(message: string, detail: string) {
    super(message)
    this.name = 'DataError'
    this.detail = detail
  }
}

const NOT_CONFIGURED = new DataError(
  'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล',
  'ไม่พบค่า VITE_SUPABASE_URL หรือ VITE_SUPABASE_PUBLISHABLE_KEY — ผู้ดูแลระบบต้องใส่ค่าทั้งสองใน Environment Variables ของ Vercel แล้ว deploy ใหม่ ระหว่างนี้ใช้โหมดดูจากไฟล์แทนได้',
)

function client() {
  if (!supabase) throw NOT_CONFIGURED
  return supabase
}

/** แปลง error จาก network หรือ PostgREST เป็นข้อความที่ทำตามต่อได้ */
function asDataError(e: unknown, what: string): DataError {
  if (e instanceof DataError) return e
  const msg = e instanceof Error ? e.message : String(e)
  if (/fetch|network|Failed to fetch|NetworkError/i.test(msg)) {
    return new DataError(
      `เชื่อมต่อฐานข้อมูลไม่ได้ ขณะ${what}`,
      'อาจเป็นเพราะเน็ตของโรงพยาบาลหลุด หรือเซิร์ฟเวอร์ปิดปรับปรุงชั่วคราว — ลองกดโหลดใหม่อีกครั้ง ถ้ายังไม่ได้ให้ใช้โหมดดูจากไฟล์ไปก่อน',
    )
  }
  return new DataError(`${what}ไม่สำเร็จ`, `ระบบตอบกลับว่า: ${msg}`)
}

export type UploadLog = {
  id: number
  uploaded_at: string
  uploaded_by: string
  day_count: number
  total_appointments: number
  date_from: string | null
  date_to: string | null
}

const PAGE = 1000

/** ดึงยอดนัดตั้งแต่วันนี้เป็นต้นไป แบ่งหน้าเพราะ PostgREST จำกัดผลลัพธ์ต่อครั้ง */
export async function fetchCounts(): Promise<CountRow[]> {
  const db = client()
  const from = dateKey(today())
  const out: CountRow[] = []

  try {
    for (let page = 0; ; page++) {
      const { data, error } = await db
        .from('appointment_counts')
        .select('appt_date, clinic_name, cnt')
        .gte('appt_date', from)
        .order('appt_date', { ascending: true })
        .range(page * PAGE, page * PAGE + PAGE - 1)

      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break

      data.forEach((r) => out.push({ d: r.appt_date, c: r.clinic_name, n: r.cnt }))
      if (data.length < PAGE) break
    }
  } catch (e) {
    throw asDataError(e, 'ดึงยอดนัด')
  }

  return out
}

/** ข้อมูลการอัปโหลดครั้งล่าสุด */
export async function fetchLatestUpload(): Promise<UploadLog | null> {
  const db = client()
  try {
    const { data, error } = await db
      .from('upload_log')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(1)
    if (error) throw new Error(error.message)
    return (data?.[0] as UploadLog) ?? null
  } catch (e) {
    throw asDataError(e, 'ดึงประวัติการอัปโหลด')
  }
}

export type ReplaceResult = {
  days: number
  total: number
  from: string | null
  to: string | null
}

/**
 * ส่งยอดชุดใหม่ขึ้นระบบเป็น batch เดียว
 * ฟังก์ชันฝั่งฐานข้อมูลตรวจรหัสเอง แล้วลบยอดตั้งแต่วันนี้เป็นต้นไปทั้งหมดก่อนใส่ชุดใหม่
 */
export async function replaceCounts(
  uploadKey: string,
  uploader: string,
  rows: CountRow[],
): Promise<ReplaceResult> {
  const db = client()

  const { data, error } = await db.rpc('replace_appointment_counts', {
    p_key: uploadKey,
    p_uploader: uploader,
    p_rows: rows,
  })

  if (error) {
    if (isBadKeyError(error)) {
      throw new DataError(
        'รหัสอัปโหลดไม่ถูกต้อง',
        'ตรวจรหัสอีกครั้ง ระวังปุ่ม Caps Lock และช่องว่างท้ายรหัส หากจำไม่ได้ให้ถามผู้ดูแลระบบ — ข้อมูลเดิมในระบบยังอยู่ครบ ไม่มีอะไรถูกลบ',
      )
    }
    throw asDataError(new Error(error.message), 'ส่งข้อมูลขึ้นระบบ')
  }

  const r = (Array.isArray(data) ? data[0] : data) as ReplaceResult | null
  if (!r) {
    throw new DataError(
      'ส่งข้อมูลขึ้นระบบแล้วแต่ระบบไม่ตอบผลลัพธ์กลับมา',
      'เปิดหน้าปฏิทินเพื่อตรวจว่ายอดขึ้นครบหรือไม่ ถ้ายอดไม่ตรงให้อัปโหลดไฟล์เดิมซ้ำอีกครั้ง',
    )
  }
  return r
}

/**
 * ฟังก์ชันในฐานข้อมูล raise exception เมื่อรหัสผิด
 * ของจริงส่ง SQLSTATE 28000 กลับมา ส่วนตัวอื่นเผื่อไว้ถ้าวันหลังมีคนแก้ฟังก์ชัน
 */
function isBadKeyError(error: { code?: string; message?: string }): boolean {
  if (error.code === '28000' || error.code === '28P01' || error.code === 'P0001') return true
  const m = error.message ?? ''
  return /รหัส|invalid key|unauthorized|wrong key|bad key|forbidden/i.test(m)
}
