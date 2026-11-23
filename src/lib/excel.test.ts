import { describe, expect, it } from 'vitest'
import { NOTE_EXCLUSION_LABEL, exclusionLabel, isSubdistrictLabNote } from './excel'

describe('กรองนัดเจาะเลือดล่วงหน้าของ รพ.สต.', () => {
  it('ตัด เมื่อหมายเหตุมีทั้ง lab และ รพ.สต.', () => {
    expect(exclusionLabel('ไม่ระบุ', 'Lab ประจำปี รพ.สต. หินโคน')).toBe(NOTE_EXCLUSION_LABEL)
    expect(exclusionLabel('ไม่ระบุ', 'Lab ประจำปี รพ.สต. บ้านบุ')).toBe(NOTE_EXCLUSION_LABEL)
  })

  it('จับ รพ.สต. ได้ทุกรูปแบบการเขียน และ lab ไม่สนตัวพิมพ์', () => {
    expect(isSubdistrictLabNote('LAB รพสต หินโคน')).toBe(true)
    expect(isSubdistrictLabNote('lab รพ สต หินโคน')).toBe(true)
  })

  it('ไม่ตัด เมื่อหมายเหตุมีแค่ lab', () => {
    expect(exclusionLabel('ไม่ระบุ', 'lab ประจำปี')).toBeNull()
  })

  it('ไม่ตัด เมื่อหมายเหตุมีแค่ รพ.สต.', () => {
    expect(
      exclusionLabel('ไม่ระบุ', 'Fluphenazine 25 mg IM ทุกวันที่ 17 ของเดือน ที่ รพ.สต.'),
    ).toBeNull()
  })

  it('ไม่ตัด เมื่อหมายเหตุว่าง', () => {
    expect(exclusionLabel('ไม่ระบุ', '')).toBeNull()
    expect(exclusionLabel('', '')).toBeNull()
  })

  it('กติกาเดิมจากห้องตรวจยังทำงาน และใช้ชื่อห้องตรวจเป็นป้าย', () => {
    expect(exclusionLabel('02607 รพ.สต.หินโคน', '')).toBe('02607 รพ.สต.หินโคน')
    expect(exclusionLabel('02607 รพ.สต.หินโคน', 'Lab ประจำปี รพ.สต. หินโคน')).toBe(
      '02607 รพ.สต.หินโคน',
    )
  })
})
