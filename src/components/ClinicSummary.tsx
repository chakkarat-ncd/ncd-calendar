import { useState } from 'react'
import { NCD_CLINICS } from '../lib/constants'

/**
 * บอกว่ายอดที่เห็นบนหน้าปฏิทินครอบคลุมคลินิกอะไรบ้าง
 * จอกว้างกางรายชื่อไว้เลย ส่วนมือถือย่อเป็นปุ่มให้กดกางเอง จะได้ไม่กินพื้นที่
 */
export function ClinicSummary() {
  const [open, setOpen] = useState(false)
  const lead = `นับรวม ${NCD_CLINICS.length} คลินิก`

  return (
    <div className="mb-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {/* มือถือ: กดเพื่อกาง */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="sm:hidden inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2
                     border border-line bg-white rounded-full px-3 py-[5px]"
        >
          {lead}
          <span className={'text-[10px] transition-transform ' + (open ? 'rotate-180' : '')}>▼</span>
        </button>

        {/* จอกว้าง: ขึ้นเป็นข้อความนำแล้วตามด้วยรายชื่อ */}
        <span className="hidden sm:inline text-[13.5px] font-medium text-ink-2">{lead}</span>

        <div className={(open ? 'flex' : 'hidden') + ' sm:flex flex-wrap gap-1.5 w-full sm:w-auto'}>
          {NCD_CLINICS.map((c) => (
            <span
              key={c}
              className="inline-block bg-[#EAF3F2] border border-[#C4DCDA] text-teal
                         rounded-full px-[9px] py-[2px] text-[12.5px] leading-[1.5]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
