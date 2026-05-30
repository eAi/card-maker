'use client'

import React from 'react'
import { Plus, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type PageBackground,
  type BackgroundFill,
  type GradientStop,
  newStopId,
  makeDefaultGradientStops,
} from '@/lib/background'

// ─── Gradient stops editor ────────────────────────────────────────────────────

function GradientStopsEditor({
  stops,
  onChange,
}: {
  stops: GradientStop[]
  onChange: (stops: GradientStop[]) => void
}) {
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const previewCSS = `linear-gradient(90deg, ${sorted.map(s => `${s.color} ${s.position}%`).join(', ')})`

  const update = (id: string, patch: Partial<GradientStop>) =>
    onChange(stops.map(s => (s.id === id ? { ...s, ...patch } : s)))

  const add = () => {
    // Pick the midpoint of the widest gap between existing stops
    let bestPos = 50
    if (sorted.length >= 2) {
      let maxGap = 0
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position
        if (gap > maxGap) {
          maxGap = gap
          bestPos = Math.round((sorted[i].position + sorted[i + 1].position) / 2)
        }
      }
    }
    const midColor = sorted[Math.floor(sorted.length / 2)]?.color ?? '#888888'
    onChange([...stops, { id: newStopId(), color: midColor, position: bestPos }])
  }

  const remove = (id: string) => {
    if (stops.length <= 2) return
    onChange(stops.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-2">
      {/* Gradient preview bar */}
      <div
        className="h-5 w-full rounded border border-slate-200"
        style={{ background: previewCSS }}
      />

      {/* Stop rows */}
      <div className="space-y-1.5">
        {sorted.map(stop => (
          <div key={stop.id} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={e => update(stop.id, { color: e.target.value })}
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5"
            />
            <Slider
              value={[stop.position]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => update(stop.id, { position: v })}
              className="flex-1"
            />
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">
              {stop.position}%
            </span>
            <button
              onClick={() => remove(stop.id)}
              disabled={stops.length <= 2}
              className="shrink-0 text-slate-300 hover:text-slate-500 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Remove stop"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
      >
        <Plus className="h-3 w-3" />
        Add colour stop
      </button>
    </div>
  )
}

// ─── Single fill editor ───────────────────────────────────────────────────────

function FillEditor({
  fill,
  onChange,
  label,
}: {
  fill: BackgroundFill
  onChange: (fill: BackgroundFill) => void
  label?: string
}) {
  const changeType = (type: 'solid' | 'linear' | 'radial') => {
    if (type === 'solid') {
      const color = fill.type !== 'solid' ? (fill.stops[0]?.color ?? '#ffffff') : fill.color
      onChange({ type: 'solid', color })
    } else if (type === 'linear') {
      const stops = fill.type !== 'solid' ? fill.stops : makeDefaultGradientStops()
      const angle = fill.type === 'linear' ? fill.angle : 135
      onChange({ type: 'linear', angle, stops })
    } else {
      const stops = fill.type !== 'solid' ? fill.stops : makeDefaultGradientStops()
      onChange({ type: 'radial', stops })
    }
  }

  return (
    <div className="space-y-2.5">
      {label && <p className="text-xs font-medium text-slate-600">{label}</p>}

      <div className="flex items-center gap-2">
        <Select value={fill.type} onValueChange={v => changeType(v as 'solid' | 'linear' | 'radial')}>
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid colour</SelectItem>
            <SelectItem value="linear">Linear gradient</SelectItem>
            <SelectItem value="radial">Radial gradient</SelectItem>
          </SelectContent>
        </Select>

        {fill.type === 'linear' && (
          <div className="flex shrink-0 items-center gap-1">
            <Input
              type="number"
              min={0}
              max={360}
              step={1}
              value={fill.angle}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) onChange({ ...fill, angle: ((v % 360) + 360) % 360 })
              }}
              className="h-8 w-16 text-right text-sm"
            />
            <span className="text-xs text-slate-500">°</span>
          </div>
        )}
      </div>

      {fill.type === 'solid' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill.color}
            onChange={e => onChange({ ...fill, color: e.target.value })}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5"
          />
          <Input
            value={fill.color}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange({ ...fill, color: v })
            }}
            className="h-8 w-28 font-mono text-sm"
            placeholder="#ffffff"
            maxLength={7}
          />
        </div>
      )}

      {(fill.type === 'linear' || fill.type === 'radial') && (
        <GradientStopsEditor
          stops={fill.stops}
          onChange={stops => onChange({ ...fill, stops } as BackgroundFill)}
        />
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface BackgroundEditorProps {
  background: PageBackground
  onChange: (bg: PageBackground) => void
}

export default function BackgroundEditor({ background, onChange }: BackgroundEditorProps) {
  const upd = (patch: Partial<PageBackground>) => onChange({ ...background, ...patch })

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-700">Page Background</h3>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
        {(['combined', 'separate'] as const).map(m => (
          <button
            key={m}
            onClick={() => upd({ mode: m })}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              background.mode === m
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {m === 'combined' ? 'Across both sides' : 'Separate sides'}
          </button>
        ))}
      </div>

      {/* Fill editor(s) */}
      {background.mode === 'combined' ? (
        <FillEditor
          fill={background.combined}
          onChange={combined => upd({ combined })}
        />
      ) : (
        <div className="space-y-3 divide-y divide-slate-100">
          <FillEditor
            fill={background.back}
            label="Back (text side)"
            onChange={back => upd({ back })}
          />
          <div className="pt-3">
            <FillEditor
              fill={background.front}
              label="Front (image side)"
              onChange={front => upd({ front })}
            />
          </div>
        </div>
      )}

      {/* Bleed */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-slate-600">Bleed</span>
        <Input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={background.bleed}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= 0) upd({ bleed: Math.round(v * 10) / 10 })
          }}
          className="h-8 w-20 text-sm"
        />
        <span className="text-xs text-slate-500">cm</span>
      </div>

      {/* Print marks */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={background.showPrintMarks}
          onChange={e => upd({ showPrintMarks: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        <span className="text-sm text-slate-700">Show print marks</span>
      </label>
    </div>
  )
}
