import { limitOf } from '../lib/constants'
import { remainingOf, type DayCount } from '../lib/counts'
import { fmt, thaiDow } from '../lib/date'

/** ตารางวันที่ยังรับนัดได้ เรียงตามวันที่ — เพดานของแต่ละวันไม่เท่ากัน จึงแสดงไว้ด้วย */
export function FreeTable({ rows, days }: { rows: DayCount[]; days: number }) {
  if (!rows.length) {
    return (
      <p className="text-muted text-sm">
        ไม่มีวันที่ยังรับได้ใน {days} วันข้างหน้า — ทุกวันที่มีคลินิกเกินเพดานของวันนั้นแล้ว
        ให้ปรึกษาหัวหน้าคลินิกก่อนนัดเพิ่ม
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>วัน</th>
            <th className="num">ยอดนัดตอนนี้</th>
            <th className="num">เพดานวันนี้</th>
            <th className="num">รับได้อีก</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const cap = limitOf(x.date).cap
            const friday = x.date.getDay() === 5
            return (
              <tr key={x.key}>
                <td>{fmt(x.date)}</td>
                <td>
                  {thaiDow(x.date)}
                  {friday && <span className="text-muted text-xs"> · CKD</span>}
                </td>
                <td className="num">{x.n}</td>
                <td className="num text-muted">{cap}</td>
                <td className="num text-ok font-semibold">{remainingOf(x)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
