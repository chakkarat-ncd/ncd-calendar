import { RANGE_OPTIONS, type RangeOption } from '../lib/constants'
import { fmt } from '../lib/date'

/** ปุ่มเลือกช่วงวันอย่างเดียว ให้ผู้เรียกจัดวางร่วมกับตัวเลขสรุปได้ในบรรทัดเดียวกัน */
export function RangeButtons({
  value,
  onChange,
}: {
  value: RangeOption
  onChange: (v: RangeOption) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {RANGE_OPTIONS.map((v) => (
        <button
          key={String(v)}
          type="button"
          className={'rb' + (v === value ? ' on' : '')}
          onClick={() => onChange(v)}
        >
          {v === 'all' ? 'ทั้งหมด' : `${v} วัน`}
        </button>
      ))}
    </div>
  )
}

/** ช่วงวันที่กำลังแสดง และคำเตือนเมื่อยังมีนัดอยู่เลยช่วงนั้น */
export function RangeNote({ from, to, beyond }: { from: Date; to: Date; beyond: number }) {
  return (
    <>
      <span className="text-[12.5px] text-muted">
        {fmt(from)} – {fmt(to)}
      </span>
      {beyond > 0 && (
        <span className="bg-warn-bg border border-warn-line text-[#7A5210] rounded-[6px] px-2 py-[2px] text-[12.5px]">
          ยังมีอีก {beyond.toLocaleString()} นัดหลัง {fmt(to)} — กด “ทั้งหมด” เพื่อดูให้ครบ
        </span>
      )}
    </>
  )
}
