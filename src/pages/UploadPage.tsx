import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClinicChips } from '../components/ClinicChips'
import { DropZone } from '../components/DropZone'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Message } from '../components/Message'
import { NCD_CLINICS } from '../lib/constants'
import { toCountRows } from '../lib/counts'
import { daysBetween, fmtFull, keyToDate, today } from '../lib/date'
import {
  defaultPicked,
  readAppointmentFile,
  SheetError,
  type ParseResult,
} from '../lib/excel'
import {
  DataError,
  fetchClinics,
  replaceCounts,
  supabaseConfigured,
  type ReplaceResult,
} from '../lib/supabase'

const UPLOADER_STORAGE_KEY = 'ncd-calendar.uploader'
/** ไฟล์ควรครอบคลุมนัดล่วงหน้าอย่างน้อยเท่านี้ ถ้าน้อยกว่านี้ให้เตือนก่อนส่ง */
const MIN_COVERAGE_DAYS = 90

type Failure = { title: string; detail: string; columns?: string[] }

export function UploadPage() {
  const [uploader, setUploader] = useState('')
  const [uploadKey, setUploadKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [fail, setFail] = useState<Failure | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<ReplaceResult | null>(null)
  // รายชื่อคลินิกจากฐานข้อมูล ถ้าดึงไม่ได้จะถอยไปใช้รายชื่อสำรองในโค้ด
  const [clinicNames, setClinicNames] = useState<readonly string[]>(NCD_CLINICS)
  const [clinicSource, setClinicSource] = useState<'db' | 'code'>('code')

  // จำชื่อผู้อัปโหลดไว้ให้ไม่ต้องพิมพ์ซ้ำ — รหัสอัปโหลดไม่ถูกเก็บไว้ที่ไหนทั้งสิ้น
  useEffect(() => {
    setUploader(localStorage.getItem(UPLOADER_STORAGE_KEY) ?? '')
  }, [])

  useEffect(() => {
    fetchClinics()
      .then((cs) => {
        if (cs.length) {
          setClinicNames(cs.map((c) => c.clinic_name))
          setClinicSource('db')
        }
      })
      .catch(() => setClinicSource('code'))
  }, [])

  function changeUploader(v: string) {
    setUploader(v)
    if (v.trim()) localStorage.setItem(UPLOADER_STORAGE_KEY, v)
    else localStorage.removeItem(UPLOADER_STORAGE_KEY)
  }

  async function handleFile(file: File) {
    setBusy(true)
    setFail(null)
    setDone(null)
    setConfirming(false)
    try {
      const r = await readAppointmentFile(file, clinicNames)
      setResult(r)
      setPicked(defaultPicked(r.clinics, clinicNames))
    } catch (e) {
      setResult(null)
      setPicked(new Set())
      if (e instanceof SheetError) setFail({ title: e.message, detail: e.detail, columns: e.columns })
      else
        setFail({
          title: 'อ่านไฟล์ไม่สำเร็จ',
          detail: `เกิดปัญหาที่ไม่คาดคิด: ${
            e instanceof Error ? e.message : String(e)
          } — ลองเปิดไฟล์ใน Excel แล้วบันทึกเป็น .xlsx ใหม่อีกครั้ง`,
        })
    } finally {
      setBusy(false)
    }
  }

  function toggle(name: string, on: boolean) {
    setConfirming(false)
    setPicked((prev) => {
      const next = new Set(prev)
      if (on) next.add(name)
      else next.delete(name)
      return next
    })
  }

  const from = today()
  const fromKey = from.getTime()

  /** แถวที่จะส่งจริง — เฉพาะคลินิกที่ติ๊ก และเฉพาะวันที่ตั้งแต่วันนี้เป็นต้นไป */
  const payload = useMemo(
    () => (result ? toCountRows(result.rows, picked, from) : []),
    [result, picked, fromKey],
  )

  const preview = useMemo(() => {
    if (!payload.length) return null
    const dates = [...new Set(payload.map((r) => r.d))].sort()
    const total = payload.reduce((s, r) => s + r.n, 0)
    const first = dates[0]
    const last = dates[dates.length - 1]
    return {
      days: dates.length,
      total,
      first,
      last,
      coverage: daysBetween(from, keyToDate(last)) + 1,
    }
  }, [payload, fromKey])

  /** นัดที่เป็นวันที่ผ่านมาแล้วในไฟล์ — ไม่ส่งขึ้นระบบ */
  const pastCount = useMemo(() => {
    if (!result) return 0
    return result.rows.filter((r) => picked.has(r.clinic) && r.date.getTime() < fromKey).length
  }, [result, picked, fromKey])

  const extraClinics = [...picked].filter((c) => !clinicNames.includes(c))

  const problems: string[] = []
  if (!uploader.trim()) problems.push('ยังไม่ได้กรอกชื่อผู้อัปโหลด')
  if (!uploadKey) problems.push('ยังไม่ได้กรอกรหัสอัปโหลด')
  if (!result) problems.push('ยังไม่ได้เลือกไฟล์นัด')
  else if (picked.size === 0) problems.push('ยังไม่ได้ติ๊กคลินิกที่จะนับ')
  else if (!payload.length) problems.push('ไม่มีนัดตั้งแต่วันนี้เป็นต้นไปในคลินิกที่ติ๊กไว้')
  if (!supabaseConfigured) problems.push('ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')

  const ready = problems.length === 0

  async function send() {
    setSending(true)
    setFail(null)
    try {
      const r = await replaceCounts(uploadKey.trim(), uploader.trim(), payload)
      setDone(r)
      setConfirming(false)
      setUploadKey('')
    } catch (e) {
      setConfirming(false)
      if (e instanceof DataError) setFail({ title: e.message, detail: e.detail })
      else
        setFail({
          title: 'ส่งข้อมูลขึ้นระบบไม่สำเร็จ',
          detail: `${
            e instanceof Error ? e.message : String(e)
          } — ข้อมูลเดิมในระบบยังอยู่ครบ ลองส่งใหม่อีกครั้ง`,
        })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-[1180px] mx-auto px-[18px] pt-[22px] pb-[70px]">
      <Header subtitle="อัปโหลดไฟล์นัดจาก HosXP เพื่อให้ทุกจอเห็นยอดชุดเดียวกัน" />

      <Message kind="info" title="ไฟล์ถูกอ่านในเบราว์เซอร์นี้เท่านั้น">
        ชื่อผู้ป่วยและ HN ในไฟล์ไม่ถูกส่งออกจากเครื่องนี้ ระบบนับยอดเสร็จแล้วจึงส่งขึ้นเฉพาะ วันที่
        ชื่อคลินิก และจำนวนนัด เท่านั้น
      </Message>

      {done ? (
        <>
          <Message kind="ok" title="ส่งข้อมูลขึ้นระบบเรียบร้อยแล้ว">
            บันทึกยอด {done.total?.toLocaleString()} นัด ครอบคลุม {done.days?.toLocaleString()} วัน
            {done.from && done.to && (
              <>
                {' '}
                ตั้งแต่ {fmtFull(keyToDate(done.from))} ถึง {fmtFull(keyToDate(done.to))}
              </>
            )}
            <br />
            ทุกจอที่เปิดหน้าปฏิทินอยู่จะเห็นยอดชุดใหม่ภายใน 5 นาที หรือกดโหลดหน้าใหม่เพื่อดูทันที
          </Message>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className="btn-primary inline-block">
              ไปหน้าปฏิทิน
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setDone(null)
                setResult(null)
                setPicked(new Set())
              }}
            >
              อัปโหลดไฟล์อื่นอีกครั้ง
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="panel">
            <h3 className="panel-h">ผู้อัปโหลดและรหัส</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="uploader">
                  ชื่อผู้อัปโหลด
                </label>
                <input
                  id="uploader"
                  className="field"
                  value={uploader}
                  onChange={(e) => changeUploader(e.target.value)}
                  placeholder="เช่น พยาบาลสมหญิง คลินิก NCD"
                  autoComplete="off"
                />
                <p className="text-muted text-[12.5px] mt-1">
                  ชื่อนี้จะขึ้นในหน้าปฏิทินว่าใครอัปเดตล่าสุด และถูกจำไว้ในเครื่องนี้
                </p>
              </div>
              <div>
                <label className="label" htmlFor="uploadKey">
                  รหัสอัปโหลด
                </label>
                <input
                  id="uploadKey"
                  className="field"
                  type="password"
                  value={uploadKey}
                  onChange={(e) => setUploadKey(e.target.value)}
                  placeholder="รหัสจากผู้ดูแลระบบ"
                  autoComplete="new-password"
                />
                <p className="text-muted text-[12.5px] mt-1">
                  รหัสไม่ถูกจำไว้ ต้องกรอกใหม่ทุกครั้งที่อัปโหลด
                </p>
              </div>
            </div>
          </div>

          <DropZone onFile={handleFile} busy={busy} />

          {fail && (
            <Message kind="err" title={fail.title}>
              {fail.detail}
              {fail.columns && (
                <div className="mt-2">
                  <span className="font-semibold">คอลัมน์ที่พบในไฟล์:</span> {fail.columns.join(' · ')}
                </div>
              )}
            </Message>
          )}

          {result && (
            <>
              {(result.badDateCount > 0 || result.ncdMissing.length > 0) && (
                <Message kind="warn" title="ข้อควรทราบเกี่ยวกับไฟล์นี้">
                  {result.badDateCount > 0 && (
                    <div>
                      {result.badDateCount.toLocaleString()} รายการอ่านวันที่ไม่ได้ จึงไม่ถูกนับ —
                      ถ้าจำนวนนี้สูงผิดปกติ ให้ตรวจรูปแบบคอลัมน์ “{result.dateColumn}” ใน Excel ก่อนส่ง
                    </div>
                  )}
                  {result.ncdMissing.length > 0 && (
                    <div>
                      ไม่พบคลินิกเหล่านี้ในไฟล์: {result.ncdMissing.join(' · ')} — อาจไม่มีนัดในช่วงนี้จริง
                      หรือชื่อคลินิกใน HosXP เปลี่ยนไป ให้ติ๊กชื่อใหม่เองจากรายการข้างล่าง
                    </div>
                  )}
                </Message>
              )}

              <div className="panel">
                <h3 className="panel-h">
                  คลินิกที่จะนับรวม
                  {clinicSource === 'code' && (
                    <span className="ml-2 font-normal text-[12px] text-warn-ink">
                      (ดึงรายชื่อจากฐานข้อมูลไม่ได้ ใช้รายชื่อสำรองในโค้ดแทน)
                    </span>
                  )}
                </h3>
                <ClinicChips
                  clinics={result.clinics}
                  picked={picked}
                  onToggle={toggle}
                  hint={`ติ๊กไว้แล้ว ${picked.size} คลินิก จากทั้งหมด ${result.clinics.length} คลินิกในไฟล์ · เฉพาะคลินิกที่ติ๊กเท่านั้นที่จะถูกส่งขึ้นระบบ`}
                />
                {extraClinics.length > 0 && (
                  <div className="text-[12.5px] text-warn-ink bg-warn-bg border border-warn-line rounded-lg px-3 py-2 mt-3">
                    มีคลินิกนอก {clinicNames.length} รายการของ NCD ถูกติ๊กไว้ด้วย:{' '}
                    {extraClinics.join(' · ')} — ถ้าไม่ตั้งใจ
                    ให้เอาติ๊กออกก่อนส่ง เพราะยอดจะถูกนับรวมในปฏิทิน
                  </div>
                )}
              </div>

              <div className="panel">
                <h3 className="panel-h">ตรวจก่อนส่ง</h3>
                {preview ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Box n={preview.days.toLocaleString()} l="วันที่มีนัด" />
                      <Box n={preview.total.toLocaleString()} l="ยอดนัดรวม" />
                      <Box n={fmtFull(keyToDate(preview.first))} l="วันแรก" small />
                      <Box n={fmtFull(keyToDate(preview.last))} l="วันสุดท้าย" small />
                    </div>

                    {preview.coverage < MIN_COVERAGE_DAYS && (
                      <Message
                        kind="warn"
                        title="ไฟล์นี้ครอบคลุมไม่ถึง 90 วันข้างหน้า"
                        className="mt-4 mb-0"
                      >
                        นัดในไฟล์มีถึงแค่ {preview.coverage} วันข้างหน้าเท่านั้น
                        หลังจากนั้นปฏิทินจะขึ้นว่าไม่มีนัดทั้งที่อาจมีนัดอยู่จริง — กลับไป export จาก HosXP
                        ให้ครอบคลุมอย่างน้อย 90 วัน หรือส่งต่อไปก่อนได้ถ้ารู้ว่าไฟล์นี้ถูกต้องแล้ว
                      </Message>
                    )}

                    {pastCount > 0 && (
                      <p className="text-muted text-[12.5px] mt-3">
                        ไฟล์นี้มีนัดย้อนหลัง {pastCount.toLocaleString()} รายการก่อนวันนี้ ระบบไม่ส่งขึ้นไป
                        เพราะปฏิทินแสดงเฉพาะวันนี้เป็นต้นไป
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted text-sm">
                    ยังไม่มีอะไรจะส่ง — ติ๊กคลินิกอย่างน้อยหนึ่งรายการที่มีนัดตั้งแต่วันนี้เป็นต้นไป
                  </p>
                )}
              </div>

              <Message kind="warn" title="การอัปโหลดจะแทนที่ข้อมูลเดิมทั้งหมด">
                ยอดนัดตั้งแต่วันนี้เป็นต้นไปที่อยู่ในระบบตอนนี้จะถูกลบทิ้งทั้งหมด แล้วแทนที่ด้วยยอดจากไฟล์นี้
                ถ้าไฟล์ไม่ครบ ยอดในระบบก็จะไม่ครบตามไปด้วย — ตรวจตัวเลขข้างบนให้แน่ใจก่อนกดยืนยัน
              </Message>

              {problems.length > 0 && (
                <Message kind="err" title="ยังส่งไม่ได้">
                  {problems.map((p, i) => (
                    <div key={i}>· {p}</div>
                  ))}
                </Message>
              )}

              {confirming ? (
                <div className="panel border-bad-line bg-bad-bg">
                  <h3 className="panel-h text-bad-ink">ยืนยันการส่งขึ้นระบบ</h3>
                  <p className="text-sm text-bad-ink mb-3">
                    กำลังจะแทนที่ยอดนัดตั้งแต่วันนี้เป็นต้นไปทั้งหมด ด้วย{' '}
                    {preview?.total.toLocaleString()} นัด ใน {preview?.days.toLocaleString()} วัน ในนามของ
                    “{uploader.trim()}” — ย้อนกลับไม่ได้
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary bg-bad"
                      onClick={() => void send()}
                      disabled={sending}
                    >
                      {sending ? 'กำลังส่ง…' : 'ยืนยัน แทนที่ข้อมูลเดิม'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setConfirming(false)}
                      disabled={sending}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!ready || sending}
                  onClick={() => setConfirming(true)}
                >
                  ส่งขึ้นระบบ
                </button>
              )}
            </>
          )}
        </>
      )}

      <Footer>
        ส่งขึ้นระบบเฉพาะ วันที่ · ชื่อคลินิก · จำนวนนัด — คอลัมน์อื่นในไฟล์ถูกทิ้งตั้งแต่ตอนอ่านไฟล์ในเบราว์เซอร์
      </Footer>
    </div>
  )
}

function Box({ n, l, small = false }: { n: string; l: string; small?: boolean }) {
  return (
    <div className="bg-paper border border-line rounded-[12px] px-4 py-3">
      <div
        className={
          (small ? 'text-[17px] font-sans' : 'text-[30px] font-mono') + ' font-semibold leading-tight'
        }
      >
        {n}
      </div>
      <div className="text-ink-2 text-[13px] mt-1">{l}</div>
    </div>
  )
}
