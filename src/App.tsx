import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarPage } from './pages/CalendarPage'

// สองหน้านี้ต้องใช้ SheetJS ที่ไฟล์ใหญ่ จึงโหลดเฉพาะตอนเปิดหน้านั้นจริง ๆ
// หน้าปฏิทินซึ่งเป็นหน้าที่คนเปิดบ่อยที่สุดจะได้ไม่ต้องรอโหลดส่วนนี้
const UploadPage = lazy(() => import('./pages/UploadPage').then((m) => ({ default: m.UploadPage })))
const HolidaysPage = lazy(() =>
  import('./pages/HolidaysPage').then((m) => ({ default: m.HolidaysPage })),
)
const LocalPage = lazy(() => import('./pages/LocalPage').then((m) => ({ default: m.LocalPage })))

function Loading() {
  return <p className="text-muted text-center py-16">กำลังโหลดหน้า…</p>
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/local" element={<LocalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
