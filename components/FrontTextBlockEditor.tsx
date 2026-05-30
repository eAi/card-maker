'use client'

import React from 'react'
import { Bold, Italic, ChevronUp, ChevronDown, X, Plus } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getFontFamilyValue } from '@/lib/fonts'
import FontPicker from '@/components/FontPicker'
import { type GradientStop, newStopId } from '@/lib/background'
import { type FrontTextBlock, type TextGradient } from '@/lib/frontText'

// ─── Gradient editor (for text fills) ────────────────────────────────────────

function TextGradientEditor({
  gradient,
  onChange,
}: {
  gradient: TextGradient
  onChange: (g: TextGradient) => void
}) {
  const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
  const previewCSS = `linear-gradient(90deg, ${sorted.map(s => `${s.color} ${s.position}%`).join(', ')})`

  const updateStop = (id: string, patch: Partial<GradientStop>) =>
    onChange({ ...gradient, stops: gradient.stops.map(s => (s.id === id ? { ...s, ...patch } : s)) })

  const addStop = () => {
    let bestPos = 50
    if (sorted.length >= 2) {
      let maxGap = 0
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position
        if (gap > maxGap) { maxGap = gap; bestPos = Math.round((sorted[i].position + sorted[i + 1].position) / 2) }
      }
    }
    const midColor = sorted[Math.floor(sorted.length / 2)]?.color ?? '#888888'
    onChange({ ...gradient, stops: [...gradient.stops, { id: newStopId(), color: midColor, position: bestPos }] })
  }

  const removeStop = (id: string) => {
    if (gradient.stops.length <= 2) return
    onChange({ ...gradient, stops: gradient.stops.filter(s => s.id !== id) })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={gradient.type} onValueChange={v => onChange({ ...gradient, type: v as 'linear' | 'radial' })}>
          <SelectTrigger className="h-8 flex-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="radial">Radial</SelectItem>
          </SelectContent>
        </Select>
        {gradient.type === 'linear' && (
          <div className="flex shrink-0 items-center gap-1">
            <Input
              type="number" min={0} max={360} step={1} value={gradient.angle}
              onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) onChange({ ...gradient, angle: ((v % 360) + 360) % 360 }) }}
              className="h-8 w-14 text-right text-sm"
            />
            <span className="text-xs text-slate-500">°</span>
          </div>
        )}
      </div>

      <div className="h-5 w-full rounded border border-slate-200" style={{ background: previewCSS }} />

      <div className="space-y-1.5">
        {sorted.map(stop => (
          <div key={stop.id} className="flex items-center gap-2">
            <input type="color" value={stop.color} onChange={e => updateStop(stop.id, { color: e.target.value })}
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5" />
            <Slider value={[stop.position]} min={0} max={100} step={1}
              onValueChange={([v]) => updateStop(stop.id, { position: v })} className="flex-1" />
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{stop.position}%</span>
            <button onClick={() => removeStop(stop.id)} disabled={gradient.stops.length <= 2}
              className="shrink-0 text-slate-300 hover:text-slate-500 disabled:pointer-events-none disabled:opacity-30">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addStop} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700">
        <Plus className="h-3 w-3" />
        Add colour stop
      </button>
    </div>
  )
}

// ─── Block editor ─────────────────────────────────────────────────────────────

interface FrontTextBlockEditorProps {
  block: FrontTextBlock
  onChange: (patch: Partial<FrontTextBlock>) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
}

export default function FrontTextBlockEditor({
  block,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FrontTextBlockEditorProps) {
  const upd = (patch: Partial<FrontTextBlock>) => onChange(patch)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">

      {/* Row 1: textarea + move/delete */}
      <div className="flex items-start gap-2">
        <textarea
          value={block.text}
          onChange={e => upd({ text: e.target.value })}
          placeholder="Your text here…"
          rows={2}
          className="min-h-[3rem] flex-1 min-w-0 resize-none rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          style={{
            fontFamily: block.fontFamily,
            fontWeight: block.bold ? 'bold' : 'normal',
            fontStyle: block.italic ? 'italic' : 'normal',
          }}
        />
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={!onMoveUp}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-25">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={!onMoveDown}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-25">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {onRemove && (
            <button onClick={onRemove}
              className="mt-0.5 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: font + size */}
      <div className="flex gap-2">
        <FontPicker
          value={block.fontFamily}
          onChange={fam => upd({ fontFamily: getFontFamilyValue(fam) })}
          triggerClassName="h-8 flex-1 min-w-0 text-sm"
        />

        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="number" min={8} max={200} step={1} value={block.fontSize}
            onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 8) upd({ fontSize: v }) }}
            className="h-8 w-16 text-right text-sm"
          />
          <span className="text-xs text-slate-500">pt</span>
        </div>
      </div>

      {/* Row 3: bold/italic + spacing */}
      <div className="flex items-center gap-2">
        <Toggle variant="outline" pressed={block.bold} onPressedChange={v => upd({ bold: v })}
          className="h-8 w-8 shrink-0 p-0" aria-label="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle variant="outline" pressed={block.italic} onPressedChange={v => upd({ italic: v })}
          className="h-8 w-8 shrink-0 p-0" aria-label="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Toggle>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="shrink-0 text-xs text-slate-500">Spacing</span>
          <Slider value={[block.letterSpacing]} min={-5} max={30} step={1}
            onValueChange={([v]) => upd({ letterSpacing: v })} className="flex-1" />
        </div>
      </div>

      {/* Fill */}
      <div className="space-y-2">
        <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
          {(['solid', 'gradient'] as const).map(t => (
            <button key={t} onClick={() => upd({ fillType: t })}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                block.fillType === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
              {t === 'solid' ? 'Solid colour' : 'Gradient'}
            </button>
          ))}
        </div>

        {block.fillType === 'solid' ? (
          <div className="flex items-center gap-2">
            <input type="color" value={block.color} onChange={e => upd({ color: e.target.value })}
              className="h-8 w-10 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5" />
            <Input value={block.color}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) upd({ color: e.target.value }) }}
              className="h-8 w-28 font-mono text-sm" maxLength={7} />
          </div>
        ) : (
          <TextGradientEditor
            gradient={block.gradient}
            onChange={gradient => upd({ gradient })}
          />
        )}
      </div>

      {/* Outline */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={block.strokeEnabled}
            onChange={e => upd({ strokeEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-700">Outline</span>
        </label>
        {block.strokeEnabled && (
          <div className="flex items-center gap-2 pl-6">
            <input type="color" value={block.strokeColor} onChange={e => upd({ strokeColor: e.target.value })}
              className="h-7 w-8 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5" />
            <span className="shrink-0 text-xs text-slate-500">Thickness</span>
            <Slider value={[block.strokeWidth]} min={0.5} max={8} step={0.5}
              onValueChange={([v]) => upd({ strokeWidth: v })} className="flex-1" />
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{block.strokeWidth}pt</span>
          </div>
        )}
      </div>

      {/* Shadow */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={block.shadowEnabled}
            onChange={e => upd({ shadowEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-700">Shadow</span>
        </label>
        {block.shadowEnabled && (
          <div className="space-y-1.5 pl-6">
            <div className="flex items-center gap-2">
              <input type="color" value={block.shadowColor} onChange={e => upd({ shadowColor: e.target.value })}
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-slate-200 p-0.5" />
              <span className="w-10 shrink-0 text-xs text-slate-500">Opacity</span>
              <Slider value={[block.shadowOpacity]} min={0} max={100} step={5}
                onValueChange={([v]) => upd({ shadowOpacity: v })} className="flex-1" />
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{block.shadowOpacity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-xs text-slate-500">Blur</span>
              <Slider value={[block.shadowBlur]} min={0} max={20} step={1}
                onValueChange={([v]) => upd({ shadowBlur: v })} className="flex-1" />
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{block.shadowBlur}pt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-xs text-slate-500">→</span>
              <Slider value={[block.shadowX]} min={-15} max={15} step={1}
                onValueChange={([v]) => upd({ shadowX: v })} className="flex-1" />
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{block.shadowX}pt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-xs text-slate-500">↓</span>
              <Slider value={[block.shadowY]} min={-15} max={15} step={1}
                onValueChange={([v]) => upd({ shadowY: v })} className="flex-1" />
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{block.shadowY}pt</span>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
