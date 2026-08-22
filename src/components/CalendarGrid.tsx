import { limitOf, TH_M, TH_D_MON_FIRST } from '../lib/constants'
import { levelOfDay, overflowOf, remainingOf, type DayCount, type Level } from '../lib/counts'
import { dateKey, fmt, padBeforeMonday, today } from '../lib/date'

const CELL: Record<Level, string> = {
  none: 'bg-none-bg border-line',
  ok: 'bg-ok-bg border-ok-line',
  warn: 'bg-warn-bg border-warn-line',
  bad: 'bg-bad-bg border-bad-line',
}
const VALUE: Record<Level, string> = {
  none: 'text-[#B8B3A9]',
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad',
}

/**
 * ขนาดตัวเลขยอดนัด — ต้องอ่านออกจากระยะนั่งทำงานแม้ตอนวางเดือนข้างกัน 3 คอลัมน์
 * ช่องเล็กสุดตอน 3 คอลัมน์กว้างราว 60px ตัวเลข 19px จึงยังเต็มตาอยู่
 */
const VALUE_SIZE = 'text-[16px] sm:text-[20px] xl:text-[19px]'
/** วันที่ไม่มีนัดแสดงขีด ให้เล็กลงเพื่อไม่ให้แย่งสายตาจากวันที่มีนัดจริง */
const DASH_SIZE = 'text-[13px] sm:text-[15px]'
const BAR: Record<Level, string> = {
  none: 'bg-transparent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
}

/** ข้อความเมื่อชี้ที่ช่องวัน บอกเพดานของวันนั้นด้วย เพราะศุกร์ใช้คนละเกณฑ์กับวันอื่น */
function tip(x: DayCount): string {
  const head = fmt(x.date)

  if (x.closed) {
    const what = x.holiday ? `วันหยุด — ${x.holiday}` : 'เสาร์อาทิตย์ ไม่มีคลินิก'
    if (x.n === 0) return `${head} — ${what}`
    return `${head} — ${what} · แต่มีนัดอยู่ ${x.n} ราย ตรวจว่าลงนัดผิดวันหรือไม่`
  }

  const cap = limitOf(x.date).cap
  const withCap = `${head} (เพดาน ${cap})`
  if (x.n === 0) return `${withCap} — ไม่มีนัด`
  const over = overflowOf(x)
  if (over > 0) return `${withCap} — ${x.n} นัด เกินเพดาน ${over} ราย`
  return `${withCap} — ${x.n} นัด รับได้อีก ${remainingOf(x)} ราย`
}

function Cell({ x, isToday }: { x: DayCount; isToday: boolean }) {
  const lv = levelOfDay(x)
  // แถบเทียบกับเพดานของวันนั้น ศุกร์ 30 นัดจึงดูเต็มกว่าพุธ 30 นัด ตามความจริง
  const pct = Math.min(100, Math.round((x.n / limitOf(x.date).cap) * 100))

  // วันหยุดกับเสาร์อาทิตย์ใช้พื้นเทาเข้มกว่าปกติ ให้ต่างจากวันทำการที่ไม่มีนัดชัดเจน
  const closedBox = 'bg-[#D9D5CB] border-[#C0B9A9]'
  const box = x.closed ? closedBox : CELL[lv]

  // ถ้าวันหยุดมีนัด ห้ามซ่อนตัวเลข ต้องเด่นกว่าปกติเพราะอาจลงนัดผิดวัน
  const misbooked = x.closed && x.n > 0

  return (
    <div
      title={tip(x)}
      className={
        // ปล่อยให้ aspect-square เป็นตัวกำหนดขนาด ช่องจึงย่อตามคอลัมน์ของเดือนได้เอง
        // min-h เหลือไว้เป็นพื้นแค่กันช่องแบนตอนจอแคบมาก ไม่ให้ไปสู้กับ aspect-square
        'aspect-square rounded-[9px] border p-1 sm:p-1.5 xl:p-1 flex flex-col justify-between ' +
        'min-h-[42px] overflow-hidden ' +
        box +
        (isToday ? ' outline outline-2 outline-ink outline-offset-1' : '')
      }
    >
      <div className="flex items-start justify-between gap-0.5 leading-none">
        <span
          className={`font-mono text-[11px] sm:text-[11.5px] ${
            x.closed ? 'text-[#8A8478]' : 'text-muted'
          }`}
        >
          {x.date.getDate()}
        </span>
        {misbooked && <span className="text-[10px] leading-none text-bad">⚠</span>}
      </div>

      <div
        className={
          'font-mono font-semibold leading-none ' +
          (misbooked
            ? `${VALUE_SIZE} text-bad`
            : x.closed
              ? `${DASH_SIZE} text-[#A9A296]`
              : `${lv === 'none' ? DASH_SIZE : VALUE_SIZE} ${VALUE[lv]}`)
        }
      >
        {x.n || '–'}
      </div>

      {x.closed ? (
        // ชื่อวันหยุดแบบย่อ ข้อความเต็มอยู่ใน tooltip เพราะช่องเล็กเกินกว่าจะใส่ทั้งชื่อ
        <div className="text-[9px] leading-[1.15] text-[#7C7669] truncate">{x.holiday ?? ''}</div>
      ) : (
        <div className="h-[3px] rounded-[2px] bg-[#E8E5DE] overflow-hidden">
          {x.n > 0 && (
            <i className={`block h-full rounded-[2px] ${BAR[lv]}`} style={{ width: `${pct}%` }} />
          )}
        </div>
      )}
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

/** ช่องว่างระหว่างช่องวันที่ ใช้ทั้งแถวหัววันและตารางวัน จึงเรียงตรงคอลัมน์กันพอดี */
const CELL_GAP = 'gap-[3px] sm:gap-[4px]'

/** ปฏิทินรายเดือน ตาราง 7 คอลัมน์ เริ่มวันจันทร์ แต่ละเดือนเป็นการ์ดของตัวเอง */
export function CalendarGrid({ list }: { list: DayCount[] }) {
  const now = today()
  const todayKey = dateKey(now)
  const months = groupByMonth(list)

  return (
    // วางเดือนข้างกันเมื่อจอกว้างพอ จะได้เห็นหลายเดือนโดยไม่ต้องเลื่อน
    // 1 คอลัมน์เมื่อแคบกว่า 900px · 2 คอลัมน์ที่ 900–1279px · 3 คอลัมน์ตั้งแต่ 1280px
    <div className="grid grid-cols-1 min-[900px]:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6 mb-[22px]">
      {months.map((mo) => {
        const isThisMonth = mo.y === now.getFullYear() && mo.m === now.getMonth()
        return (
          <section
            key={`${mo.y}-${mo.m}`}
            className="bg-card border border-line-dark rounded-[12px] overflow-hidden"
          >
            {/* แถบหัวเดือน เดือนปัจจุบันเป็นพื้นเข้มตัวอักษรขาว เดือนอื่นเป็นพื้นเทาอ่อน */}
            <div
              className={
                'flex items-baseline justify-between gap-2 px-3 py-[7px] ' +
                (isThisMonth ? 'bg-month-head text-white' : 'bg-[#EDEAE4] text-ink')
              }
            >
              <h4 className="text-[17px] font-bold leading-tight">
                {TH_M[mo.m]} {mo.y + 543}
              </h4>
              {isThisMonth && (
                <span className="text-[11.5px] font-medium bg-white/20 rounded px-1.5 py-[1px] shrink-0">
                  เดือนนี้
                </span>
              )}
            </div>

            {/* padding แนวนอนบางที่สุดเท่าที่ยังดูเป็นกรอบ เพื่อไม่ให้ช่องวันที่ถูกบีบ */}
            <div className="px-1 pt-1.5 pb-1.5">
              {/* หัววัน มีเส้นคั่นยาวต่อเนื่องใต้แถว แยกออกจากตารางวันที่ */}
              <div className={`grid grid-cols-7 ${CELL_GAP} border-b border-line-dark pb-1 mb-1.5`}>
                {TH_D_MON_FIRST.map((d, i) => (
                  <div
                    key={d}
                    className={
                      'text-center text-xs font-medium ' +
                      // ส กับ อา อยู่ท้ายแถวเพราะเริ่มนับที่วันจันทร์
                      (i >= 5 ? 'text-muted' : 'text-ink-2')
                    }
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className={`grid grid-cols-7 ${CELL_GAP}`}>
                {Array.from({ length: mo.pad }, (_, i) => (
                  <div key={`pad${i}`} />
                ))}
                {mo.days.map((x) => (
                  <Cell key={x.key} x={x} isToday={x.key === todayKey} />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
