import { useState } from 'react'
import { activeClinicsOn } from '../lib/counts'
import { dateKey, fmt, keyToDate, today } from '../lib/date'
import type { ClinicConfig } from '../lib/supabase'

/**
 * บอกว่ายอดที่เห็นบนหน้าปฏิทินครอบคลุมคลินิกอะไรบ้าง
 * แสดงเฉพาะคลินิกที่ยังเปิดอยู่ ณ วันนี้ ตามตาราง clinic_config
 * จอกว้างกางรายชื่อไว้เลย ส่วนมือถือย่อเป็นปุ่มให้กดกางเอง จะได้ไม่กินพื้นที่
 */
export function ClinicSummary({ clinics }: { clinics: ClinicConfig[] }) {
  const [open, setOpen] = useState(false)
  const active = activeClinicsOn(clinics, dateKey(today()))
  if (!active.length) return null

  const lead = `นับรวม ${active.length} คลินิก`

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
          {active.map((c) => (
            <span
              key={c.clinic_name}
              className="inline-flex items-baseline gap-1 bg-[#EAF3F2] border border-[#C4DCDA] text-teal
                         rounded-full px-[9px] py-[2px] text-[12.5px] leading-[1.5]"
            >
              {c.clinic_name}
              {c.active_until && (
                // คลินิกที่มีกำหนดปิด ต้องบอกให้ทีมรู้ว่าเลยวันนี้ไปจะไม่ถูกนับแล้ว
                <span className="text-[11px] text-warn-ink font-medium">
                  ถึง {fmt(keyToDate(c.active_until))}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
