import { FRIDAY_LIMIT, NORMAL_LIMIT } from '../lib/constants'

// ตัวเลขทุกตัวดึงจากตารางเกณฑ์โดยตรง คำอธิบายจึงเปลี่ยนตามเองเมื่อแก้เกณฑ์
const ITEMS = [
  { cls: 'bg-ok-bg border-ok-line', label: `ไม่เกิน ${NORMAL_LIMIT.green} — ยังรับได้` },
  {
    cls: 'bg-warn-bg border-warn-line',
    label: `${NORMAL_LIMIT.green + 1}–${NORMAL_LIMIT.cap} — ใกล้เต็ม`,
  },
  { cls: 'bg-bad-bg border-bad-line', label: `เกิน ${NORMAL_LIMIT.cap} — เกินเพดาน` },
  { cls: 'bg-none-bg border-line', label: 'ไม่มีนัด' },
]

export function Legend() {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
        {ITEMS.map((i) => (
          <span key={i.label} className="inline-flex items-center gap-1.5">
            <i className={`w-[13px] h-[13px] rounded-[4px] border inline-block ${i.cls}`} />
            {i.label}
          </span>
        ))}
      </div>
      {/* กันคนอ่านงงว่าทำไมศุกร์ 62 เป็นแดง แต่พุธ 62 เป็นเหลือง */}
      <div className="mt-2 inline-flex flex-wrap items-baseline gap-x-1.5 text-[12.5px] text-ink-2 bg-[#F1EFE9] border border-line rounded-lg px-3 py-1.5">
        <span className="font-semibold">วันศุกร์ใช้เกณฑ์เข้มกว่า</span>
        <span>
          เพราะเป็นวันคลินิก CKD — เขียวไม่เกิน {FRIDAY_LIMIT.green} · เหลือง{' '}
          {FRIDAY_LIMIT.green + 1}–{FRIDAY_LIMIT.cap} · แดงเกิน {FRIDAY_LIMIT.cap}
        </span>
      </div>
    </div>
  )
}
