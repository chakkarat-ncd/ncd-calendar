import { FRIDAY_LIMIT, NORMAL_LIMIT } from '../lib/constants'

// ตัวเลขทุกตัวดึงจากตารางเกณฑ์โดยตรง คำอธิบายจึงเปลี่ยนตามเองเมื่อแก้เกณฑ์
const ITEMS = [
  { cls: 'bg-ok-bg border-ok-line', label: `ไม่เกิน ${NORMAL_LIMIT.green}` },
  { cls: 'bg-warn-bg border-warn-line', label: `${NORMAL_LIMIT.green + 1}–${NORMAL_LIMIT.cap}` },
  { cls: 'bg-bad-bg border-bad-line', label: `เกิน ${NORMAL_LIMIT.cap}` },
  { cls: 'bg-none-bg border-line', label: 'ไม่มีนัด' },
]

/** คำอธิบายสีแบบบรรทัดเดียว รวมหมายเหตุวันศุกร์ไว้ในแถวเดียวกันเพื่อประหยัดพื้นที่แนวตั้ง */
export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-2 mb-2.5">
      {ITEMS.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <i className={`w-[12px] h-[12px] rounded-[3px] border inline-block ${i.cls}`} />
          {i.label}
        </span>
      ))}
      {/* กันคนอ่านงงว่าทำไมศุกร์ 62 เป็นแดง แต่พุธ 62 เป็นเหลือง */}
      <span className="inline-flex items-center gap-1.5 bg-[#F1EFE9] border border-line rounded-md px-2 py-[2px]">
        <strong className="font-semibold">ศุกร์เข้มกว่า</strong>
        <span>
          คลินิก CKD — เขียวไม่เกิน {FRIDAY_LIMIT.green} · เหลือง {FRIDAY_LIMIT.green + 1}–
          {FRIDAY_LIMIT.cap} · แดงเกิน {FRIDAY_LIMIT.cap}
        </span>
      </span>
    </div>
  )
}
