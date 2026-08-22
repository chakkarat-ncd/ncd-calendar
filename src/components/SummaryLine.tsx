import type { Summary } from '../lib/counts'

/**
 * ตัวเลขสรุปแบบกะทัดรัดบรรทัดเดียว
 * คงสีเดิมไว้ทั้งแดง เหลือง เขียว เพื่อให้กวาดตาเห็นได้เหมือนตอนเป็นกล่องใหญ่
 * แต่กินพื้นที่แนวตั้งน้อยลงมาก ปฏิทินจึงขึ้นมาอยู่สูงกว่าเดิม
 */
export function SummaryLine({ summary, days }: { summary: Summary; days: number }) {
  const items = [
    { n: summary.has.length, label: `วันที่มีนัดใน ${days} วัน`, tone: 'text-ink' },
    { n: summary.over.length, label: 'เกินเพดาน', tone: 'text-bad' },
    { n: summary.near.length, label: 'ใกล้เต็ม', tone: 'text-warn' },
    { n: summary.free.length, label: 'ยังรับได้', tone: 'text-ok' },
  ]

  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-[13.5px] text-ink-2">
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-baseline gap-1">
          {i > 0 && <span className="text-line mr-1">·</span>}
          <strong className={`font-mono text-[19px] font-semibold leading-none ${it.tone}`}>
            {it.n}
          </strong>
          <span>{it.label}</span>
        </span>
      ))}
      {summary.misbooked.length > 0 && (
        // วันหยุดที่มีนัดไม่ถูกนับรวมข้างบน จึงต้องบอกแยกไว้ ไม่ให้หายไปเงียบ ๆ
        <span className="inline-flex items-baseline gap-1 bg-bad-bg border border-bad-line text-bad-ink rounded-md px-2 py-[1px] ml-1">
          <span>⚠</span>
          <strong className="font-mono font-semibold">{summary.misbooked.length}</strong>
          <span className="text-[12.5px]">วันหยุดที่มีนัด</span>
        </span>
      )}
    </div>
  )
}
