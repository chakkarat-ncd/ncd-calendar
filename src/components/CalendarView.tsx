import { Link } from 'react-router-dom'
import type { RangeOption } from '../lib/constants'
import {
  buildDayList,
  countBeyond,
  maxDateOf,
  resolveDays,
  summarize,
  yearsMissingHolidays,
} from '../lib/counts'
import { addDays, today } from '../lib/date'
import { CalendarGrid } from './CalendarGrid'
import { FreeTable } from './FreeTable'
import { Legend } from './Legend'
import { Message } from './Message'
import { RangeButtons, RangeNote } from './RangePicker'
import { SummaryLine } from './SummaryLine'

/**
 * ส่วนแสดงผลปฏิทินที่ใช้ร่วมกันระหว่างหน้าหลักกับโหมดดูจากไฟล์
 * รับมาแค่ยอดรายวัน จึงไม่รู้จักที่มาของข้อมูลว่ามาจาก Supabase หรือจากไฟล์ในเครื่อง
 *
 * holidays ส่งมาเฉพาะหน้าที่ต่อฐานข้อมูล โหมดดูจากไฟล์ไม่มีข้อมูลวันหยุด
 * จึงถือว่าปิดเฉพาะเสาร์อาทิตย์
 */
export function CalendarView({
  counts,
  range,
  onRange,
  holidays,
}: {
  counts: Map<string, number>
  range: RangeOption
  onRange: (v: RangeOption) => void
  holidays?: Map<string, string>
}) {
  const from = today()
  const days = resolveDays(range, from, maxDateOf(counts.keys()))
  const end = addDays(from, days - 1)
  const list = buildDayList(counts, from, days, holidays)
  const summary = summarize(list)
  const beyond = countBeyond(counts, end)

  // ปีที่อยู่ในช่วงที่แสดงแต่ยังไม่มีวันหยุดในระบบเลย
  const missingYears = holidays ? yearsMissingHolidays(list, holidays.keys()) : []

  return (
    <>
      {missingYears.length > 0 && (
        <Message
          kind="warn"
          title={`ยังไม่ได้ใส่วันหยุดราชการปี พ.ศ. ${missingYears.join(' และ ')}`}
          className="mb-2.5"
        >
          วันหยุดของปีนั้นจะแสดงเป็นวันทำการปกติ และถูกนับรวมในวันที่ยังรับนัดได้ —{' '}
          <Link to="/holidays" className="underline font-medium">
            ไปหน้าจัดการวันหยุด
          </Link>
        </Message>
      )}

      {/* ตัวเลขสรุปกับปุ่มเลือกช่วงอยู่แถวเดียวกัน ปฏิทินจึงขึ้นมาอยู่สูงกว่าเดิม */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
        <SummaryLine summary={summary} days={days} />
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:ml-auto">
          <RangeButtons value={range} onChange={onRange} />
          <RangeNote from={from} to={end} beyond={beyond} />
        </div>
      </div>

      <Legend />

      <CalendarGrid list={list} />

      <div className="panel">
        <h3 className="panel-h">วันที่ยังรับนัดได้ — ใช้ตอบผู้ป่วยเมื่อวันที่ขอมาเต็มแล้ว</h3>
        <FreeTable rows={summary.available} days={days} />
      </div>
    </>
  )
}
