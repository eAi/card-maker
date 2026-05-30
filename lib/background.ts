export interface GradientStop {
  id: string
  color: string
  position: number // 0–100
}

export interface SolidFill {
  type: 'solid'
  color: string
}

export interface LinearFill {
  type: 'linear'
  angle: number // degrees
  stops: GradientStop[]
}

export interface RadialFill {
  type: 'radial'
  stops: GradientStop[]
}

export type BackgroundFill = SolidFill | LinearFill | RadialFill

export interface PageBackground {
  mode: 'combined' | 'separate'
  /** Used when mode === 'combined': one fill spanning both panels */
  combined: BackgroundFill
  /** Used when mode === 'separate': image side (right/front panel) */
  front: BackgroundFill
  /** Used when mode === 'separate': text side (left/back panel) */
  back: BackgroundFill
  /** Extends background beyond card edge, in cm */
  bleed: number
  showPrintMarks: boolean
}

export const WHITE_FILL: BackgroundFill = { type: 'solid', color: '#ffffff' }

export const DEFAULT_PAGE_BACKGROUND: PageBackground = {
  mode: 'combined',
  combined: WHITE_FILL,
  front: WHITE_FILL,
  back: WHITE_FILL,
  bleed: 0,
  showPrintMarks: true,
}

export function fillToCSS(fill: BackgroundFill): string {
  if (fill.type === 'solid') return fill.color
  const stops = fill.stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')
  if (fill.type === 'linear') return `linear-gradient(${fill.angle}deg, ${stops})`
  return `radial-gradient(circle, ${stops})`
}

export function newStopId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function makeDefaultGradientStops(): GradientStop[] {
  return [
    { id: newStopId(), color: '#ffffff', position: 0 },
    { id: newStopId(), color: '#cccccc', position: 100 },
  ]
}
