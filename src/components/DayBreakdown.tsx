import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { limitOf, TH_M } from '../lib/constants'
import { overflowOf, remainingOf, type ClinicCount, type DayCount } from '../lib/counts'
import { thaiDow } from '../lib/date'

/** ระยะห่างจากขอบจอ และระยะห่างจากช่องวัน */
const EDGE = 8
const GAP = 6

/** จ. 23 พ.ย. 2569 */
function headOf(d: Date): string {
  return `${thaiDow(d)}. ${d.getDate()} ${TH_M[d.getMonth()]} ${d.getFullYear() + 543}`
}

/**
 * กล่องยอดแยกรายคลินิกของหนึ่งวัน ใช้แทน tooltip ของเบราว์เซอร์ และบอกข้อมูลที่ tip() เคยบอกครบ
 * - วันทำการ: วันที่ เพดาน รายคลินิก ยอดรวม และเกินเพดานกี่ราย หรือรับได้อีกกี่ราย
 * - วันปิดที่ไม่มีนัด: หยุดเพราะอะไร
 * - วันปิดที่มีนัด: รายคลินิกตามปกติ พร้อมคำเตือนให้ตรวจว่าลงนัดผิดวันหรือไม่
 * ลอยอยู่เหนือหน้าด้วย position: fixed
 * วาดไว้ที่ document.body จึงไม่ถูกกล่องเดือนตัดขอบ และไม่ดันช่องวันให้เปลี่ยนขนาด
 * ปกติอยู่ใต้ช่องวัน ถ้าล้นขอบล่างของจอให้พลิกขึ้นด้านบน ถ้าล้นขอบขวาให้ชิดเข้ามา
 */
export function DayBreakdown({
  x,
  items,
  anchor,
}: {
  x: DayCount
  items: ClinicCount[]
  anchor: HTMLElement
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const r = anchor.getBoundingClientRect()
    // ใช้ขนาดของ layout viewport ให้ตรงกับระบบพิกัดของ position: fixed แม้ผู้ใช้ซูมอยู่
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight
    const w = box.offsetWidth
    const h = box.offsetHeight

    let top = r.bottom + GAP
    if (top + h > vh - EDGE) {
      const above = r.top - GAP - h
      top = above >= EDGE ? above : Math.max(EDGE, vh - EDGE - h)
    }
    const left = Math.max(EDGE, Math.min(r.left, vw - EDGE - w))
    setPos({ top, left })
  }, [anchor, x.key])

  const cap = limitOf(x.date).cap
  const over = overflowOf(x)
  const why = x.holiday ? `วันหยุด — ${x.holiday}` : 'เสาร์อาทิตย์ ไม่มีคลินิก'

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="z-50 pointer-events-none w-[270px] max-w-[calc(100vw-16px)] bg-white border border-line-dark
                 rounded-[10px] shadow-lg px-3 py-2.5 text-[14px] text-ink"
    >
      <div className="border-b border-line pb-1.5 mb-1.5 leading-snug">
        <div className="font-semibold text-[15px]">{headOf(x.date)}</div>
        <div className="text-ink-2">{x.closed ? why : `เพดาน ${cap} นัด`}</div>
      </div>

      {x.closed && x.n === 0 ? (
        <div className="text-ink-2">ไม่มีนัด</div>
      ) : (
        <>
          <ul className="space-y-[3px]">
            {items.map((it) => (
              <li key={it.clinic} className="flex items-baseline justify-between gap-3 leading-snug">
                <span className="text-ink-2">{it.clinic}</span>
                <span className="font-mono font-semibold tabular-nums">{it.n}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-line mt-1.5 pt-1.5 space-y-[2px]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">รวม</span>
              <span className="tabular-nums">
                <strong className={`font-mono font-bold ${x.closed || over > 0 ? 'text-bad' : ''}`}>
                  {x.n}
                </strong>
                {!x.closed && <span className="text-ink-2"> / เพดาน {cap}</span>}
              </span>
            </div>
            {x.closed ? (
              // วันปิดไม่มีเพดาน นัดที่มีอยู่น่าจะลงผิดวัน
              <div className="text-bad font-semibold">
                ⚠ มีนัดอยู่ {x.n} ราย ตรวจว่าลงนัดผิดวันหรือไม่
              </div>
            ) : over > 0 ? (
              <div className="text-bad font-semibold">เกินเพดาน {over} ราย</div>
            ) : (
              <div className="text-ok-ink font-semibold">รับได้อีก {remainingOf(x)} ราย</div>
            )}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
