import type { CSSProperties } from 'react'
import { type GradientStop, newStopId } from '@/lib/background'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextGradient {
  type: 'linear' | 'radial'
  angle: number
  stops: GradientStop[]
}

export interface FrontTextBlock {
  id: string
  text: string
  fontFamily: string
  fontSize: number      // pt
  bold: boolean
  italic: boolean
  letterSpacing: number // hundredths of em; 0 = normal, 10 = 0.1em
  // Fill
  fillType: 'solid' | 'gradient'
  color: string         // hex, for solid fill
  gradient: TextGradient
  // Outline
  strokeEnabled: boolean
  strokeColor: string   // hex
  strokeWidth: number   // pt
  // Shadow
  shadowEnabled: boolean
  shadowColor: string   // hex
  shadowOpacity: number // 0–100
  shadowBlur: number    // pt
  shadowX: number       // pt (positive = right)
  shadowY: number       // pt (positive = down)
}

export interface FrontTextContent {
  blocks: FrontTextBlock[]
  /** 0–100%: distance from top of front panel to top of text group */
  verticalOffset: number
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_GRADIENT: TextGradient = {
  type: 'linear',
  angle: 180,
  stops: [
    { id: newStopId(), color: '#f97316', position: 0 },
    { id: newStopId(), color: '#ec4899', position: 100 },
  ],
}

const BASE_BLOCK: Omit<FrontTextBlock, 'id' | 'text' | 'fontSize'> = {
  fontFamily: "'Playfair Display', serif",
  bold: false,
  italic: false,
  letterSpacing: 0,
  fillType: 'solid',
  color: '#1a1a1a',
  gradient: DEFAULT_GRADIENT,
  strokeEnabled: false,
  strokeColor: '#000000',
  strokeWidth: 1,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowOpacity: 40,
  shadowBlur: 4,
  shadowX: 2,
  shadowY: 2,
}

export const DEFAULT_FRONT_TEXT: FrontTextContent = {
  blocks: [
    { id: 'init-1', text: 'Happy Birthday', fontSize: 40, ...BASE_BLOCK },
  ],
  verticalOffset: 25,
}

export function newBlockId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function makeNewBlock(fontSize = 24): FrontTextBlock {
  return { id: newBlockId(), text: '', fontSize, ...BASE_BLOCK }
}

// ─── CSS helpers ──────────────────────────────────────────────────────────────

export function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`
}

export function computeTextBlockStyle(block: FrontTextBlock): CSSProperties {
  const base: CSSProperties = {
    fontFamily: block.fontFamily,
    fontSize: `${block.fontSize}pt`,
    fontWeight: block.bold ? 'bold' : 'normal',
    fontStyle: block.italic ? 'italic' : 'normal',
    letterSpacing: block.letterSpacing !== 0 ? `${block.letterSpacing / 100}em` : undefined,
    lineHeight: 1.2,
    display: 'block',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: '100%',
  }

  if (block.shadowEnabled) {
    base.textShadow = `${block.shadowX}pt ${block.shadowY}pt ${block.shadowBlur}pt ${hexToRgba(block.shadowColor, block.shadowOpacity)}`
  }

  if (block.fillType === 'gradient') {
    const stopCSS = [...block.gradient.stops]
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${s.position}%`)
      .join(', ')
    const grad =
      block.gradient.type === 'linear'
        ? `linear-gradient(${block.gradient.angle}deg, ${stopCSS})`
        : `radial-gradient(circle, ${stopCSS})`
    base.background = grad
    base.WebkitBackgroundClip = 'text'
    base.WebkitTextFillColor = 'transparent'
    base.backgroundClip = 'text'
    base.color = 'transparent'
  } else {
    base.color = block.color
  }

  if (block.strokeEnabled && block.strokeWidth > 0) {
    base.WebkitTextStroke = `${block.strokeWidth}pt ${block.strokeColor}`
  }

  return base
}
