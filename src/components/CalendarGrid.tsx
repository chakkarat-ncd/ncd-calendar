import { CAP, TH_M, TH_D_MON_FIRST } from '../lib/constants'
import { levelOf, type DayCount, type Level } from '../lib/counts'
import { dateKey, fmt, padBeforeMonday, today } from '../lib/date'

const CELL: Record<Level, string> = {
  none: 'bg-none-bg border-line',
  ok: 'bg-ok-bg border-ok-line',
  warn: 'bg-warn-bg border-warn-line',
  bad: 'bg-bad-bg border-bad-line',
}
const VALUE: Record<Level, string> = {
  none: 'text-[#B8B3A9] text-[15px]',
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad',
}
const BAR: Record<Level, string> = {
  none: 'bg-transparent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
}

function tip(x: DayCount): string {
  if (x.n === 0) return `${fmt(x.date)} — ไม่มีนัด`
  if (x.n > CAP) return `${fmt(x.date)} — เกินเพดาน ${x.n - CAP} ราย`
  return `${fmt(x.date)} — รับได้อีก ${CAP - x.n} ราย`
}

function Cell({ x, isToday }: { x: DayCount; isToday: boolean }) {
  const lv = levelOf(x.n)
  const pct = Math.min(100, Math.round((x.n / CAP) * 100))
  return (
    <div
      title={tip(x)}
      className={
        'aspect-square rounded-[9px] border p-1 sm:p-1.5 flex flex-col justify-between ' +
        'min-h-[52px] sm:min-h-[64px] ' +
        CELL[lv] +
        (isToday ? ' outline outline-2 outline-ink outline-offset-1' : '')
      }
    >
      <div className="font-mono text-[11.5px] text-muted leading-none">{x.date.getDate()}</div>
      <div className={`font-mono text-[16px] sm:text-[21px] font-semibold leading-none ${VALUE[lv]}`}>
        {x.n || '–'}
      </div>
      <div className="h-[3px] rounded-[2px] bg-[#E8E5DE] overflow-hidden">
        {x.n > 0 && <i className={`block h-full rounded-[2px] ${BAR[lv]}`} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  )
}

type Month = { y: number; m: number; pad: number; days: DayCount[] }

/** แบ่งรายการวันเป็นรายเดือน พร้อมช่องว่างนำหน้าเดือนแรกของแต่ละกลุ่ม */
function groupByMonth(list: DayCount[]): Month[] {
  const out: Month[] = []
  list.forEach((x) => {
    const last = out[out.length - 1]
    if (!last || last.y !== x.date.getFullYear() || last.m !== x.date.getMonth()) {
      out.push({
        y: x.date.getFullYear(),
        m: x.date.getMonth(),
        pad: padBeforeMonday(x.date),
        days: [x],
      })
    } else {
      last.days.push(x)
    }
  })
  return out
}

/** ปฏิทินรายเดือน ตาราง 7 คอลัมน์ เริ่มวันจันทร์ */
export function CalendarGrid({ list }: { list: DayCount[] }) {
  const todayKey = dateKey(today())
  const months = groupByMonth(list)

  return (
    <div>
      {months.map((mo) => (
        <section key={`${mo.y}-${mo.m}`} className="mb-[22px]">
          <h4 className="text-base font-semibold mb-2 pl-0.5">
            {TH_M[mo.m]} {mo.y + 543}
          </h4>
          <div className="grid grid-cols-7 gap-[3px] sm:gap-[5px]">
            {TH_D_MON_FIRST.map((d) => (
              <div key={d} className="text-center text-xs text-muted font-medium py-[3px]">
                {d}
              </div>
            ))}
            {Array.from({ length: mo.pad }, (_, i) => (
              <div key={`pad${i}`} />
            ))}
            {mo.days.map((x) => (
              <Cell key={x.key} x={x} isToday={x.key === todayKey} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
