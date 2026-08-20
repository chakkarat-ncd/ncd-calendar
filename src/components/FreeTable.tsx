import { CAP } from '../lib/constants'
import type { DayCount } from '../lib/counts'
import { fmt, thaiDow } from '../lib/date'

/** ตารางวันที่ยังรับนัดได้ เรียงตามวันที่ */
export function FreeTable({ rows, days }: { rows: DayCount[]; days: number }) {
  if (!rows.length) {
    return (
      <p className="text-muted text-sm">
        ไม่มีวันที่ยังรับได้ใน {days} วันข้างหน้า — ทุกวันที่มีคลินิกเกินเพดาน 80 แล้ว
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
            <th className="num">รับได้อีก</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.key}>
              <td>{fmt(x.date)}</td>
              <td>{thaiDow(x.date)}</td>
              <td className="num">{x.n}</td>
              <td className="num text-ok font-semibold">{CAP - x.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
