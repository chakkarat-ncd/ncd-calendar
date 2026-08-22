import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarView } from '../components/CalendarView'
import { ClinicSummary } from '../components/ClinicSummary'
import { Footer } from '../components/Footer'
import { FreshnessBar } from '../components/FreshnessBar'
import { Header } from '../components/Header'
import { Message } from '../components/Message'
import { DEFAULT_RANGE, STALE_DAYS, type RangeOption } from '../lib/constants'
import { tallyRowsByDay, type CountRow } from '../lib/counts'
import { daysBetween, fmtDateTime } from '../lib/date'
import {
  DataError,
  fetchClinics,
  fetchCounts,
  fetchHolidays,
  fetchLatestUpload,
  supabaseConfigured,
  type ClinicConfig,
  type UploadLog,
} from '../lib/supabase'

/** โหลดข้อมูลใหม่ทุก 5 นาที */
const REFRESH_MS = 5 * 60 * 1000

export function CalendarPage() {
  const [rows, setRows] = useState<CountRow[]>([])
  const [log, setLog] = useState<UploadLog | null>(null)
  const [clinics, setClinics] = useState<ClinicConfig[]>([])
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map())
  const [range, setRange] = useState<RangeOption>(DEFAULT_RANGE)
  const [error, setError] = useState<DataError | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const inFlight = useRef(false)

  const load = useCallback(async (showSpinner: boolean) => {
    if (inFlight.current) return
    inFlight.current = true
    if (showSpinner) setLoading(true)
    try {
      const [counts, latest, cfg, hol] = await Promise.all([
        fetchCounts(),
        fetchLatestUpload(),
        fetchClinics(),
        fetchHolidays(),
      ])
      setRows(counts)
      setLog(latest)
      setClinics(cfg)
      setHolidays(new Map(hol.map((h) => [h.holiday_date, h.title])))
      setLoadedAt(new Date())
      setError(null)
    } catch (e) {
      setError(
        e instanceof DataError
          ? e
          : new DataError('โหลดข้อมูลไม่สำเร็จ', String(e)),
      )
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(true)

    const timer = window.setInterval(() => void load(false), REFRESH_MS)

    // กลับมาที่แท็บนี้เมื่อไร ให้ดึงยอดล่าสุดทันที เผื่อมีคนอัปโหลดระหว่างที่เปิดค้างไว้
    const onWake = () => {
      if (document.visibilityState === 'visible') void load(false)
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [load])

  const counts = tallyRowsByDay(rows, clinics)
  const uploadedAt = log ? new Date(log.uploaded_at) : null
  const staleDays = uploadedAt ? daysBetween(uploadedAt, new Date()) : null
  const stale = staleDays !== null && staleDays > STALE_DAYS

  return (
    <div className="max-w-[1180px] xl:max-w-[1440px] mx-auto px-[18px] pt-4 pb-[70px]">
      <Header subtitle="โรงพยาบาลจักราช · เพดาน 80 นัดต่อวัน · ศุกร์ 60 เพราะเป็นคลินิก CKD" />

      {error ? (
        <>
          <Message kind="err" title={error.message}>
            {error.detail}
          </Message>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className="btn-primary" onClick={() => void load(true)}>
              ลองโหลดใหม่
            </button>
            <Link to="/local" className="btn-ghost inline-block">
              ไปโหมดดูจากไฟล์
            </Link>
          </div>
          <Message kind="info" title="โหมดดูจากไฟล์ทำอะไรได้บ้าง">
            เปิดไฟล์นัดจาก HosXP ในเครื่องแล้วดูปฏิทินได้ทันที ไม่ต้องพึ่งฐานข้อมูล
            ใช้เป็นทางสำรองระหว่างที่ระบบมีปัญหา ข้อมูลไม่ถูกส่งออกจากเครื่องนี้
          </Message>
        </>
      ) : loading ? (
        <p className="text-muted py-10 text-center">กำลังโหลดยอดนัดจากระบบ…</p>
      ) : rows.length === 0 ? (
        <>
          <Message kind="warn" title="ยังไม่มียอดนัดในระบบ">
            ระบบเชื่อมต่อได้ตามปกติ แต่ยังไม่มีใครอัปโหลดไฟล์นัด หรือยอดที่อัปโหลดไว้เป็นวันที่ผ่านมาแล้วทั้งหมด
            — ไปที่หน้าอัปโหลดเพื่อส่งไฟล์นัดล่าสุดจาก HosXP ขึ้นระบบ
          </Message>
          <Link to="/upload" className="btn-primary inline-block">
            ไปหน้าอัปโหลด
          </Link>
        </>
      ) : (
        <>
          {stale && (
            <Message kind="warn" title="ข้อมูลอาจไม่ทันสมัย">
              อัปโหลดครั้งล่าสุดเมื่อ {staleDays} วันที่แล้ว ยอดที่เห็นอาจไม่ตรงกับ HosXP ตอนนี้ —
              ให้ผู้รับผิดชอบ export ไฟล์นัดใหม่แล้วอัปโหลดซ้ำ
            </Message>
          )}

          <ClinicSummary clinics={clinics} />

          {uploadedAt && (
            <FreshnessBar
              uploadedAt={uploadedAt}
              uploadedBy={log?.uploaded_by ?? ''}
              days={staleDays ?? 0}
              loading={loading}
              onReload={() => void load(true)}
            />
          )}

          <CalendarView counts={counts} range={range} onRange={setRange} holidays={holidays} />
        </>
      )}

      <Footer>
        {uploadedAt && (
          <>
            อัปเดตล่าสุด {fmtDateTime(uploadedAt)} โดย {log?.uploaded_by || 'ไม่ระบุชื่อ'} ·{' '}
            {log?.day_count?.toLocaleString()} วัน ·{' '}
            {log?.total_appointments?.toLocaleString()} นัด
            <br />
          </>
        )}
        {loadedAt && !error && <>ดึงข้อมูลจากระบบเมื่อ {fmtDateTime(loadedAt)} · รีเฟรชอัตโนมัติทุก 5 นาที</>}
        {!supabaseConfigured && <>ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล</>}
      </Footer>
    </div>
  )
}
