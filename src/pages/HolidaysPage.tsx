import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Message } from '../components/Message'
import { tallyRowsByDay, type CountRow } from '../lib/counts'
import { dateKey, fmtFull, keyToDate, thaiDow, today } from '../lib/date'
import {
  DataError,
  fetchClinics,
  fetchCounts,
  fetchHolidays,
  setHoliday,
  supabaseConfigured,
  type ClinicConfig,
  type Holiday,
} from '../lib/supabase'

type Failure = { title: string; detail: string }

export function HolidaysPage() {
  const [uploadKey, setUploadKey] = useState('')
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fail, setFail] = useState<Failure | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [hs, rows, clinics] = await Promise.all([
        fetchHolidays(),
        fetchCounts(),
        fetchClinics(),
      ])
      setHolidays(hs)
      setCounts(tallyRowsByDay(rows as CountRow[], clinics as ClinicConfig[]))
      setFail(null)
    } catch (e) {
      setFail(
        e instanceof DataError
          ? { title: e.message, detail: e.detail }
          : { title: 'โหลดข้อมูลไม่สำเร็จ', detail: String(e) },
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const todayKey = dateKey(today())
  const existing = useMemo(
    () => new Map(holidays.map((h) => [h.holiday_date, h])),
    [holidays],
  )

  /** จำนวนนัดของวันที่เลือก ใช้เตือนก่อนบันทึกว่ามีนัดค้างอยู่ */
  const apptOnDate = date ? (counts.get(date) ?? 0) : 0
  const alreadyHoliday = date ? existing.get(date) : undefined

  const problems: string[] = []
  if (!supabaseConfigured) problems.push('ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')
  if (!uploadKey) problems.push('ยังไม่ได้กรอกรหัสอัปโหลด')
  if (!date) problems.push('ยังไม่ได้เลือกวันที่')
  if (!title.trim()) problems.push('ยังไม่ได้ใส่ชื่อวันหยุด')

  async function save() {
    setSaving(true)
    setFail(null)
    setDone(null)
    try {
      await setHoliday(uploadKey.trim(), date, title.trim(), note.trim() || null)
      setDone(`บันทึก “${title.trim()}” วันที่ ${fmtFull(keyToDate(date))} แล้ว`)
      setTitle('')
      setNote('')
      await load()
    } catch (e) {
      setFail(
        e instanceof DataError
          ? { title: e.message, detail: e.detail }
          : { title: 'บันทึกไม่สำเร็จ', detail: String(e) },
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(d: string) {
    setSaving(true)
    setFail(null)
    setDone(null)
    try {
      // ส่งชื่อว่างคือคำสั่งลบ ตามที่ฟังก์ชันฝั่งฐานข้อมูลกำหนดไว้
      await setHoliday(uploadKey.trim(), d, '', null)
      setDone(`ลบวันหยุดวันที่ ${fmtFull(keyToDate(d))} แล้ว`)
      setConfirmDelete(null)
      await load()
    } catch (e) {
      setFail(
        e instanceof DataError
          ? { title: e.message, detail: e.detail }
          : { title: 'ลบไม่สำเร็จ', detail: String(e) },
      )
    } finally {
      setSaving(false)
    }
  }

  const upcoming = holidays.filter((h) => h.holiday_date >= todayKey)
  const past = holidays.filter((h) => h.holiday_date < todayKey)

  return (
    <div className="max-w-[1180px] mx-auto px-[18px] pt-4 pb-[70px]">
      <Header subtitle="จัดการวันหยุด — วันที่ตั้งเป็นวันหยุดจะไม่ถูกนับว่าเป็นวันที่รับนัดได้" />

      {fail && (
        <Message kind="err" title={fail.title}>
          {fail.detail}
        </Message>
      )}
      {done && (
        <Message kind="ok" title={done}>
          หน้าปฏิทินจะเห็นการเปลี่ยนแปลงภายใน 5 นาที หรือกดโหลดใหม่เพื่อดูทันที —{' '}
          <Link to="/" className="underline font-medium">
            ไปหน้าปฏิทิน
          </Link>
        </Message>
      )}

      <div className="panel">
        <h3 className="panel-h">เพิ่มหรือแก้วันหยุด</h3>
        <div className="grid sm:grid-cols-[auto_1fr_1fr] gap-3">
          <div>
            <label className="label" htmlFor="hdate">
              วันที่
            </label>
            <input
              id="hdate"
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="htitle">
              ชื่อวันหยุด
            </label>
            <input
              id="htitle"
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น วันปิยมหาราช"
            />
          </div>
          <div>
            <label className="label" htmlFor="hnote">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <input
              id="hnote"
              className="field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ชดเชย"
            />
          </div>
        </div>

        <div className="mt-3 max-w-md">
          <label className="label" htmlFor="hkey">
            รหัสอัปโหลด
          </label>
          <input
            id="hkey"
            type="password"
            className="field"
            value={uploadKey}
            onChange={(e) => setUploadKey(e.target.value)}
            placeholder="รหัสเดียวกับที่ใช้อัปโหลดไฟล์นัด"
            autoComplete="new-password"
          />
          <p className="text-muted text-[12.5px] mt-1">รหัสไม่ถูกจำไว้ ต้องกรอกใหม่ทุกครั้ง</p>
        </div>

        {date && (
          <div className="mt-3 space-y-2">
            <div className="text-[13.5px] text-ink-2">
              เลือกวัน {thaiDow(keyToDate(date))} ที่ {fmtFull(keyToDate(date))}
            </div>
            {apptOnDate > 0 && (
              <Message kind="warn" title={`วันนี้มีนัดอยู่แล้ว ${apptOnDate.toLocaleString()} ราย`} className="mb-0">
                ถ้าตั้งเป็นวันหยุด นัดเหล่านี้จะไม่หายไปจากระบบ แต่จะขึ้นเป็นวันหยุดที่มีนัดพร้อมสัญลักษณ์เตือน
                ในปฏิทิน และไม่ถูกนับเป็นวันที่รับนัดได้ — ควรตรวจกับ HosXP ว่าต้องเลื่อนนัดหรือไม่
              </Message>
            )}
            {alreadyHoliday && (
              <Message kind="info" title={`วันนี้เป็นวันหยุดอยู่แล้ว: ${alreadyHoliday.title}`} className="mb-0">
                บันทึกอีกครั้งจะเป็นการแก้ชื่อวันหยุดเดิม
              </Message>
            )}
          </div>
        )}

        {problems.length > 0 && (
          <Message kind="err" title="ยังบันทึกไม่ได้" className="mt-3 mb-0">
            {problems.map((p, i) => (
              <div key={i}>· {p}</div>
            ))}
          </Message>
        )}

        <button
          type="button"
          className="btn-primary mt-3"
          disabled={problems.length > 0 || saving}
          onClick={() => void save()}
        >
          {saving ? 'กำลังบันทึก…' : 'บันทึกวันหยุด'}
        </button>
      </div>

      <div className="panel">
        <h3 className="panel-h">
          วันหยุดที่ยังไม่ถึง ({upcoming.length} วัน)
        </h3>
        {loading ? (
          <p className="text-muted text-sm">กำลังโหลด…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-muted text-sm">
            ยังไม่มีวันหยุดข้างหน้าในระบบ — วันหยุดราชการจะแสดงเป็นวันทำการปกติจนกว่าจะใส่
          </p>
        ) : (
          <HolidayTable
            rows={upcoming}
            counts={counts}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            onDelete={remove}
            saving={saving}
            canDelete={Boolean(uploadKey)}
          />
        )}
      </div>

      {past.length > 0 && (
        <div className="panel">
          <h3 className="panel-h">วันหยุดที่ผ่านมาแล้ว ({past.length} วัน)</h3>
          <HolidayTable
            rows={past}
            counts={counts}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            onDelete={remove}
            saving={saving}
            canDelete={Boolean(uploadKey)}
          />
        </div>
      )}

      <Footer>วันหยุดมีผลกับการนับทันทีที่บันทึก ทุกจอที่เปิดหน้าปฏิทินอยู่จะเห็นภายใน 5 นาที</Footer>
    </div>
  )
}

function HolidayTable({
  rows,
  counts,
  confirmDelete,
  setConfirmDelete,
  onDelete,
  saving,
  canDelete,
}: {
  rows: Holiday[]
  counts: Map<string, number>
  confirmDelete: string | null
  setConfirmDelete: (d: string | null) => void
  onDelete: (d: string) => void
  saving: boolean
  canDelete: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>วัน</th>
            <th>ชื่อวันหยุด</th>
            <th>หมายเหตุ</th>
            <th className="num">นัดค้างอยู่</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => {
            const d = keyToDate(h.holiday_date)
            const n = counts.get(h.holiday_date) ?? 0
            return (
              <tr key={h.holiday_date}>
                <td>{fmtFull(d)}</td>
                <td>{thaiDow(d)}</td>
                <td className="font-medium">{h.title}</td>
                <td className="text-muted">{h.note ?? ''}</td>
                <td className={'num ' + (n > 0 ? 'text-bad font-semibold' : 'text-muted')}>
                  {n > 0 ? `⚠ ${n}` : '–'}
                </td>
                <td className="text-right">
                  {confirmDelete === h.holiday_date ? (
                    <span className="inline-flex gap-1.5">
                      <button
                        type="button"
                        className="rb bg-bad-bg border-bad-line text-bad-ink"
                        disabled={saving}
                        onClick={() => onDelete(h.holiday_date)}
                      >
                        ยืนยันลบ
                      </button>
                      <button
                        type="button"
                        className="rb"
                        disabled={saving}
                        onClick={() => setConfirmDelete(null)}
                      >
                        ยกเลิก
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rb"
                      disabled={!canDelete || saving}
                      title={canDelete ? undefined : 'กรอกรหัสอัปโหลดก่อนจึงจะลบได้'}
                      onClick={() => setConfirmDelete(h.holiday_date)}
                    >
                      ลบ
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
