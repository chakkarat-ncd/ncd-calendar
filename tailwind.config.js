/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16262E',
        'ink-2': '#33505C',
        muted: '#7A8F99',
        paper: '#F7F5F0',
        card: '#FFFFFF',
        line: '#DFDBD2',
        // กรอบเข้มกว่าเส้นทั่วไป ใช้กับการ์ดเดือนและเส้นคั่นใต้แถวหัววัน
        'line-dark': '#BFB7A6',
        // แถบหัวของเดือนปัจจุบัน เทาเข้มแทนที่จะเป็นเกือบดำ
        'month-head': '#4F5559',
        teal: '#0E6E6B',
        ok: '#4E8B5B',
        'ok-bg': '#E3EFE4',
        'ok-line': '#C3DCC7',
        'ok-ink': '#356B42',
        warn: '#B7791F',
        'warn-bg': '#FBF0D9',
        'warn-line': '#E8D6A4',
        'warn-ink': '#8A5B10',
        bad: '#B33A33',
        'bad-bg': '#F8E0DC',
        'bad-line': '#E7BDB6',
        'bad-ink': '#8C2B25',
        'none-bg': '#F0EEE9',
      },
      fontFamily: {
        sans: ["'IBM Plex Sans Thai'", 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
}
