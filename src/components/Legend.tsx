const ITEMS = [
  { cls: 'bg-ok-bg border-ok-line', label: 'ไม่เกิน 60 — ยังรับได้' },
  { cls: 'bg-warn-bg border-warn-line', label: '61–80 — ใกล้เต็ม' },
  { cls: 'bg-bad-bg border-bad-line', label: 'เกิน 80 — เกินเพดาน' },
  { cls: 'bg-none-bg border-line', label: 'ไม่มีนัด' },
]

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2 mb-4">
      {ITEMS.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <i className={`w-[13px] h-[13px] rounded-[4px] border inline-block ${i.cls}`} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
