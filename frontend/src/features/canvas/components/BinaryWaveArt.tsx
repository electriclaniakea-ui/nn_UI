import { useEffect, useRef } from 'react'
const IMG_SRC = '/input.png'

const OPTS = {
  fontSize: 9,
  fontFamily: '"Courier New",Courier,"Lucida Console",monospace',
  waveAmplitude: 0.35,
  waveFrequency: 0.06,
  waveSpeed: 0.12,
  textColor: '#ffffff',
  bgColor: '#000000',
  brightnessBoost: 0.08
}

function gb(id: ImageData, x: number, y: number, w: number, h: number): number {
  if (x < 0 || x >= w || y < 0 || y >= h) return 0
  const i = (Math.floor(y) * w + Math.floor(x)) * 4
  return (0.299 * id.data[i] + 0.587 * id.data[i + 1] + 0.114 * id.data[i + 2]) / 255
}

function sb(id: ImageData, iw: number, ih: number, gx: number, gy: number, c: number, r: number): number {
  const sx = iw / c
  const sy = ih / r
  return gb(id, gx * sx + sx / 2, gy * sy + sy / 2, iw, ih)
}

function wf(x: number, y: number, t: number, o: typeof OPTS): number {
  const fx = x * o.waveFrequency
  const fy = y * o.waveFrequency
  const tt = t * o.waveSpeed
  let f = Math.sin(fx + fy * 0.3 + tt)
    + Math.sin(fx * 0.7 + fy * 1.1 + tt * 1.3) * 0.6
    + Math.sin(fx * 1.5 - fy * 0.5 + tt * 2) * 0.3
    + Math.sin(fx * 0.3 + fy * 2 + tt * 3.5) * 0.15
  return Math.max(-1, Math.min(1, f / 2.05))
}

class B {
  c: HTMLCanvasElement
  x: CanvasRenderingContext2D
  i: ImageData | null = null
  I: number = 0
  Hh: number = 0
  W: number = 0
  H: number = 0
  C: number = 0
  R: number = 0
  g: { b: number; v: number }[][] = []
  t: number = 0
  o: typeof OPTS
  p: boolean = false
  r: number | null = null

  constructor() {
    this.c = document.createElement('canvas')
    this.x = this.c.getContext('2d', { alpha: false })!
    this.o = { ...OPTS }
  }

  init(container: HTMLElement) {
    const c = this.c
    c.style.display = 'block'
    c.style.width = '100%'
    c.style.height = '100%'
    c.style.imageRendering = 'pixelated'
    container.appendChild(c)

    const img = new Image()
    img.onload = () => {
      const tc = document.createElement('canvas')
      tc.width = img.width
      tc.height = img.height
      const tx = tc.getContext('2d')!
      tx.drawImage(img, 0, 0)
      this.i = tx.getImageData(0, 0, img.width, img.height)
      this.I = img.width
      this.H = img.height
      this.o = { ...OPTS }
      this.t = 0
      this._s()
      this._g()
      this._d()
      this.p = false
      this._a()
    }
    img.src = IMG_SRC
  }

  _s() {
    const o = this.o
    const a = this.I / this.H
    const cw = this.c.clientWidth
    const ch = this.c.clientHeight
    const ca = cw / ch
    let tw: number, th: number
    if (ca > a) {
      th = ch
      tw = th * a
    } else {
      tw = cw
      th = tw / a
    }
    tw = Math.floor(tw)
    th = Math.floor(th)
    this.Hh = Math.max(1, Math.round(o.fontSize))
    this.W = Math.max(1, Math.round(o.fontSize * 0.6))
    this.C = Math.max(10, Math.floor(tw / this.W))
    this.R = Math.max(10, Math.floor(th / this.Hh))
    const pw = this.C * this.W
    const ph = this.R * this.Hh
    if (this.c.width !== pw || this.c.height !== ph) {
      this.c.width = pw
      this.c.height = ph
    }
  }

  _g() {
    this.g = []
    for (let y = 0; y < this.R; y++) {
      const r: { b: number; v: number }[] = []
      for (let x = 0; x < this.C; x++) {
        const b = sb(this.i!, this.I, this.H, x, y, this.C, this.R)
        const bb = Math.min(1, b + this.o.brightnessBoost)
        r.push({ b: bb, v: Math.random() < bb ? 1 : 0 })
      }
      this.g.push(r)
    }
  }

  _u() {
    const o = this.o
    for (let y = 0; y < this.R; y++) {
      for (let x = 0; x < this.C; x++) {
        const c = this.g[y][x]
        const w = wf(x, y, this.t, o)
        let p = c.b
        const m = w * o.waveAmplitude
        p = p + m * (1 - Math.abs(p - 0.5) * 2)
        p = Math.max(0.02, Math.min(0.98, p))
        const ac = 1 - Math.abs(p - 0.5) * 1.5
        if (Math.random() < 0.1 + ac * 0.4) {
          c.v = Math.random() < p ? 1 : 0
        }
      }
    }
  }

  _d() {
    const x = this.x
    const o = this.o
    const cw = this.W
    const ch = this.Hh
    x.fillStyle = o.bgColor
    x.fillRect(0, 0, this.c.width, this.c.height)
    x.imageSmoothingEnabled = false
    x.font = o.fontSize + 'px ' + o.fontFamily
    x.textAlign = 'left'
    x.textBaseline = 'top'
    for (let y = 0; y < this.R; y++) {
      for (let x0 = 0; x0 < this.C; x0++) {
        const c = this.g[y][x0]
        const b = c.b
        const r = Math.round(34 + b * 221)
        x.fillStyle = 'rgb(' + r + ',' + r + ',' + r + ')'
        x.fillText(c.v === 1 ? '1' : '0', x0 * cw, y * ch)
      }
    }
  }

  _a() {
    if (!this.p) return
    this.t++
    this._u()
    this._d()
    this.r = requestAnimationFrame(this._a.bind(this))
  }

  play() {
    this.p = true
    this._a()
    return this
  }

  pause() {
    this.p = false
    if (this.r) {
      cancelAnimationFrame(this.r)
      this.r = null
    }
    return this
  }
}

export function BinaryWaveArt() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<B | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      // 清空容器
      containerRef.current.innerHTML = ''
      const renderer = new B()
      renderer.init(containerRef.current)
      renderer.play()
      rendererRef.current = renderer

      // 处理窗口大小变化
      const handleResize = () => {
        if (rendererRef.current) {
          rendererRef.current._s()
          rendererRef.current._g()
          rendererRef.current._d()
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        renderer.pause()
        rendererRef.current = null
      }
    }
  }, [])

  return (
    <div className="mt-6">
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '300px',
          border: '1px solid #333',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#000000'
        }}
      />
      <div className="mt-2 text-right text-sm text-text-secondary">
        producer： Laniakea
      </div>
    </div>
  )
}