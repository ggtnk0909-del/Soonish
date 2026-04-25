import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 針の先端座標を計算（中心512, 半径r, 角度deg: 0=12時方向）
function handPoint(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// 7:10 → 時針: 7時10分の角度, 分針: 10分の角度
const hourDeg   = (7 + 10 / 60) * 30      // 1時間=30度
const minuteDeg = 10 * 6                   // 1分=6度

const cx = 512, cy = 512

const hourTip   = handPoint(cx, cy, 200, hourDeg)
const hourTail  = handPoint(cx, cy, -55, hourDeg)
const minuteTip = handPoint(cx, cy, 370, minuteDeg)
const minutTail = handPoint(cx, cy, -75, minuteDeg)

// 時間目盛り（12個）
const tickMarks = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30
  const outer = handPoint(cx, cy, 408, deg)
  const inner = handPoint(cx, cy, i % 3 === 0 ? 368 : 385, deg)
  const w = i % 3 === 0 ? 8 : 4
  return `<line x1="${outer.x.toFixed(1)}" y1="${outer.y.toFixed(1)}" x2="${inner.x.toFixed(1)}" y2="${inner.y.toFixed(1)}" stroke="#8b6500" stroke-width="${w}" stroke-linecap="round" opacity="0.6"/>`
}).join('\n  ')

// 前10分の扇形（通知のランダム幅を視覚化）
const fuzzR = 392
const fuzzStartDeg = minuteDeg - 10 * 6  // 10分前
const fuzzEndDeg   = minuteDeg            // 長針位置
const fuzzStart = handPoint(cx, cy, fuzzR, fuzzStartDeg)
const fuzzEnd   = handPoint(cx, cy, fuzzR, fuzzEndDeg)
const fuzzArc = `M ${cx} ${cy} L ${fuzzStart.x.toFixed(1)} ${fuzzStart.y.toFixed(1)} A ${fuzzR} ${fuzzR} 0 0 1 ${fuzzEnd.x.toFixed(1)} ${fuzzEnd.y.toFixed(1)} Z`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- Background: 青 -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a8fff"/>
      <stop offset="100%" stop-color="#0055d4"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Clock face with border -->
  <circle cx="${cx}" cy="${cy}" r="424" fill="#c8a84b" opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="416" fill="#fdf6e3"/>

  <!-- ±5分の扇形 -->
  <path d="${fuzzArc}" fill="#b8860b" opacity="0.22"/>

  <!-- Tick marks -->
  ${tickMarks}

  <!-- Minute hand（長・細・ゴールド） -->
  <line x1="${minutTail.x.toFixed(1)}" y1="${minutTail.y.toFixed(1)}"
        x2="${minuteTip.x.toFixed(1)}" y2="${minuteTip.y.toFixed(1)}"
        stroke="#d4a017" stroke-width="10" stroke-linecap="round"/>

  <!-- Hour hand（短・太・濃いゴールド） -->
  <line x1="${hourTail.x.toFixed(1)}" y1="${hourTail.y.toFixed(1)}"
        x2="${hourTip.x.toFixed(1)}" y2="${hourTip.y.toFixed(1)}"
        stroke="#8b6500" stroke-width="22" stroke-linecap="round"/>

  <!-- Center dot -->
  <circle cx="${cx}" cy="${cy}" r="20" fill="#8b6500"/>
  <circle cx="${cx}" cy="${cy}" r="8"  fill="#fdf6e3"/>
</svg>`

const svgPath = resolve(__dirname, '../assets/icon.svg')
const pngPath = resolve(__dirname, '../assets/icon.png')

writeFileSync(svgPath, svg)

await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile(pngPath)

console.log('icon.png generated')

// adaptive-icon（Android用, 同じもので代用）
await sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile(resolve(__dirname, '../assets/adaptive-icon.png'))

console.log('adaptive-icon.png generated')

// iOSネイティブプロジェクトにも同期
const iosIconPath = resolve(__dirname, '../ios/Soonish/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png')
await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(iosIconPath)
console.log('iOS AppIcon synced')
