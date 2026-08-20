import type { ReactNode } from 'react'

type Kind = 'err' | 'warn' | 'ok' | 'info'

const STYLE: Record<Kind, string> = {
  err: 'bg-bad-bg border-[#E3B5AF] text-bad-ink',
  warn: 'bg-warn-bg border-[#E5CE95] text-[#7A5210]',
  ok: 'bg-ok-bg border-ok-line text-ok-ink',
  info: 'bg-[#EAF3F2] border-[#B9D8D6] text-[#0B5350]',
}

/** แถบข้อความ — บอกว่าเกิดอะไร (title) และต้องทำอะไรต่อ (children) */
export function Message({
  kind,
  title,
  children,
  className = '',
}: {
  kind: Kind
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-[10px] border px-4 py-3 text-sm mb-4 ${STYLE[kind]} ${className}`}>
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={title ? 'mt-1 leading-relaxed' : 'leading-relaxed'}>{children}</div>}
    </div>
  )
}
