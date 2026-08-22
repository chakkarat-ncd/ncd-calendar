import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'ปฏิทิน' },
  { to: '/upload', label: 'อัปโหลด' },
  { to: '/local', label: 'ดูจากไฟล์' },
]

export function Header({ subtitle }: { subtitle: ReactNode }) {
  return (
    <header className="border-b-2 border-ink pb-2.5 mb-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-0.02em] leading-tight">
            ปฏิทินยอดนัด คลินิก NCD
          </h1>
          <div className="text-ink-2 text-sm mt-[3px]">{subtitle}</div>
        </div>
        <nav className="flex gap-1.5 shrink-0">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                'rounded-[7px] px-3 py-[6px] text-[13px] border ' +
                (isActive
                  ? 'bg-ink border-ink text-white font-semibold'
                  : 'bg-white border-line text-ink-2 hover:border-teal hover:text-teal')
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
