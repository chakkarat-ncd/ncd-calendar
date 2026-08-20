import type { ClinicTally } from '../lib/excel'

/** ชิปเลือกคลินิกที่จะนับรวม พร้อมจำนวนแถวที่พบในไฟล์ */
export function ClinicChips({
  clinics,
  picked,
  onToggle,
  hint,
}: {
  clinics: ClinicTally[]
  picked: Set<string>
  onToggle: (name: string, on: boolean) => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-[7px]">
        {clinics.map((c) => {
          const on = picked.has(c.name)
          return (
            <label key={c.name} className={'chip' + (on ? ' on' : '')}>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => onToggle(c.name, e.target.checked)}
                className="w-[15px] h-[15px] cursor-pointer accent-teal"
              />
              <span>{c.name}</span>
              <span className="font-mono text-muted text-xs">{c.n.toLocaleString()}</span>
            </label>
          )
        })}
      </div>
      {hint && <div className="text-muted text-[12.5px] mt-2.5">{hint}</div>}
    </div>
  )
}
