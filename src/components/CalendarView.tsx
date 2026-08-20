import type { RangeOption } from '../lib/constants'
import {
  buildDayList,
  countBeyond,
  maxDateOf,
  resolveDays,
  summarize,
} from '../lib/counts'
import { addDays, today } from '../lib/date'
import { CalendarGrid } from './CalendarGrid'
import { FreeTable } from './FreeTable'
import { Legend } from './Legend'
import { RangePicker } from './RangePicker'
import { StatCards } from './StatCards'

/**
 * ส่วนแสดงผลปฏิทินที่ใช้ร่วมกันระหว่างหน้าหลักกับโหมดดูจากไฟล์
 * รับมาแค่ยอดรายวัน จึงไม่รู้จักที่มาของข้อมูลว่ามาจาก Supabase หรือจากไฟล์ในเครื่อง
 */
export function CalendarView({
  counts,
  range,
  onRange,
}: {
  counts: Map<string, number>
  range: RangeOption
  onRange: (v: RangeOption) => void
}) {
  const from = today()
  const days = resolveDays(range, from, maxDateOf(counts.keys()))
  const end = addDays(from, days - 1)
  const list = buildDayList(counts, from, days)
  const summary = summarize(list)
  const beyond = countBeyond(counts, end)

  return (
    <>
      <StatCards summary={summary} days={days} />

      <RangePicker
        value={range}
        onChange={onRange}
        from={from}
        to={end}
        days={days}
        beyond={beyond}
      />

      <Legend />

      <CalendarGrid list={list} />

      <div className="panel">
        <h3 className="panel-h">วันที่ยังรับนัดได้ — ใช้ตอบผู้ป่วยเมื่อวันที่ขอมาเต็มแล้ว</h3>
        <FreeTable rows={summary.available} days={days} />
      </div>
    </>
  )
}
