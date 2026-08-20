import type { ReactNode } from 'react'
import { PRIVACY_NOTE } from '../lib/constants'

export function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="text-muted text-[12.5px] border-t border-line pt-[14px] mt-[26px] leading-relaxed">
      {children && <div className="mb-1">{children}</div>}
      <div>{PRIVACY_NOTE}</div>
    </footer>
  )
}
