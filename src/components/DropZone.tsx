import { useRef, useState } from 'react'

/** ช่องลากไฟล์มาวางหรือกดเลือกไฟล์ */
export function DropZone({
  onFile,
  title = 'วางไฟล์นัดจาก HosXP ที่นี่',
  note = 'ลากไฟล์มาวาง หรือกดเลือกไฟล์ · รองรับ .xlsx .xls .csv',
  busy = false,
}: {
  onFile: (f: File) => void
  title?: string
  note?: string
  busy?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <div
      onClick={() => !busy && input.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files[0]
        if (f && !busy) onFile(f)
      }}
      className={
        'border-2 border-dashed rounded-[14px] bg-card px-5 py-[26px] text-center mb-4 transition-colors ' +
        (busy ? 'cursor-wait opacity-70 border-line ' : 'cursor-pointer ') +
        (over ? 'border-teal bg-[#F2F8F7]' : 'border-line hover:border-teal hover:bg-[#F2F8F7]')
      }
    >
      <h2 className="text-[17px] font-semibold mb-[5px]">{busy ? 'กำลังอ่านไฟล์…' : title}</h2>
      <p className="text-muted text-[13.5px]">{note}</p>
      <span className="inline-block mt-3 bg-ink text-white px-5 py-[9px] rounded-lg font-semibold text-sm">
        เลือกไฟล์
      </span>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
