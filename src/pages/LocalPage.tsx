import { useMemo, useState } from 'react'
import { CalendarView } from '../components/CalendarView'
import { ClinicChips } from '../components/ClinicChips'
import { DropZone } from '../components/DropZone'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Message } from '../components/Message'
import { DEFAULT_RANGE, type RangeOption } from '../lib/constants'
import { tallyByDay } from '../lib/counts'
import { fmt, fmtDateTime } from '../lib/date'
import {
  defaultPicked,
  readAppointmentFile,
  SheetError,
  type ParseResult,
} from '../lib/excel'

type Failure = { title: string; detail: string; columns?: string[] }

/**
 * โหมดดูจากไฟล์ — พฤติกรรมเดียวกับไฟล์ HTML ต้นแบบ
 * ไฟล์ถูกอ่านในเบราว์เซอร์เท่านั้น ไม่แตะ Supabase เลย ใช้เป็นทางสำรองเมื่อระบบมีปัญหา
 */
export function LocalPage() {
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState<Failure | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [range, setRange] = useState<RangeOption>(DEFAULT_RANGE)

  async function handleFile(file: File) {
    setBusy(true)
    setFail(null)
    try {
      const r = await readAppointmentFile(file)
      setResult(r)
      setPicked(defaultPicked(r.clinics))
    } catch (e) {
      setResult(null)
      setPicked(new Set())
      if (e instanceof SheetError) setFail({ title: e.message, detail: e.detail, columns: e.columns })
      else
        setFail({
          title: 'อ่านไฟล์ไม่สำเร็จ',
          detail: `เกิดปัญหาที่ไม่คาดคิด: ${e instanceof Error ? e.message : String(e)} — ลองเปิดไฟล์ใน Excel แล้วบันทึกเป็น .xlsx ใหม่อีกครั้ง`,
        })
    } finally {
      setBusy(false)
    }
  }

  function toggle(name: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (on) next.add(name)
      else next.delete(name)
      return next
    })
  }

  const counts = useMemo(
    () => (result ? tallyByDay(result.rows, picked) : new Map<string, number>()),
    [result, picked],
  )

  const warnings: string[] = []
  if (result?.badDateCount)
    warnings.push(`${result.badDateCount.toLocaleString()} รายการอ่านวันที่ไม่ได้ จึงไม่ถูกนับ`)
  if (result?.ncdMissing.length)
    warnings.push(
      'ไม่พบคลินิกเหล่านี้ในไฟล์: ' +
        result.ncdMissing.join(' · ') +
        ' (อาจไม่มีนัดในช่วงนี้ หรือชื่อในระบบเปลี่ยนไป)',
    )

  const total = [...counts.values()].reduce((s, n) => s + n, 0)

  return (
    <div className="max-w-[1180px] xl:max-w-[1440px] mx-auto px-[18px] pt-[22px] pb-[70px]">
      <Header subtitle="โหมดดูจากไฟล์ · ประมวลผลในเครื่องนี้เท่านั้น ไม่ส่งข้อมูลออกไปที่ใด" />

      <Message kind="info" title="โหมดนี้ไม่เกี่ยวกับข้อมูลกลาง">
        ปฏิทินที่เห็นในหน้านี้มาจากไฟล์ที่เปิดในเครื่องนี้ ไม่ได้อ่านหรือเขียนข้อมูลบนระบบกลาง
        ปิดหน้านี้แล้วข้อมูลหายไปทันที ใช้เป็นทางสำรองเมื่อระบบกลางมีปัญหา
      </Message>

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

      {warnings.length > 0 && (
        <Message kind="warn" title="ข้อควรทราบเกี่ยวกับไฟล์นี้">
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </Message>
      )}

      {result && (
        <>
          <div className="panel">
            <h3 className="panel-h">คลินิกที่นับรวม</h3>
            <ClinicChips
              clinics={result.clinics}
              picked={picked}
              onToggle={toggle}
              hint={`ติ๊กไว้แล้ว ${picked.size} คลินิก จากทั้งหมด ${result.clinics.length} คลินิกในไฟล์ · ปรับได้ถ้าชื่อคลินิกในระบบเปลี่ยน`}
            />
          </div>

          {picked.size === 0 ? (
            <Message kind="warn" title="ยังไม่ได้เลือกคลินิก">
              ตอนนี้ไม่มีคลินิกไหนถูกติ๊กไว้ ปฏิทินจึงว่างเปล่า — ติ๊กคลินิกที่ต้องการนับอย่างน้อยหนึ่งรายการ
            </Message>
          ) : (
            <CalendarView counts={counts} range={range} onRange={setRange} />
          )}
        </>
      )}

      <Footer>
        {result && (
          <>
            ไฟล์: {result.fileName} · แผ่นงาน {result.sheetName} · นับ {total.toLocaleString()} นัด จาก{' '}
            {picked.size} คลินิก · เปิดไฟล์เมื่อ {fmtDateTime(new Date())}
            <br />
            ใช้คอลัมน์ “{result.clinicColumn}” และ “{result.dateColumn}” · วันที่ในไฟล์ถึง{' '}
            {result.rows.reduce((m, r) => (r.date > m ? r.date : m), result.rows[0].date) &&
              fmt(result.rows.reduce((m, r) => (r.date > m ? r.date : m), result.rows[0].date))}
            <br />
          </>
        )}
        หน้านี้ไม่ส่งข้อมูลออกไปที่ใด และไม่เชื่อมต่อกับ HosXP
      </Footer>
    </div>
  )
}
