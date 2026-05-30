'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import ImageDropzone from '@/components/ImageDropzone'
import FrontTextBlockEditor from '@/components/FrontTextBlockEditor'
import {
  type FrontTextContent,
  DEFAULT_FRONT_TEXT,
  makeNewBlock,
} from '@/lib/frontText'

interface FrontPanelEditorProps {
  mode: 'image' | 'text'
  onModeChange: (mode: 'image' | 'text') => void
  image: string | null
  onImageChange: (image: string | null) => void
  imageScale: number
  onImageScaleChange: (scale: number) => void
  frontText: FrontTextContent
  onFrontTextChange: (t: FrontTextContent) => void
}

export default function FrontPanelEditor({
  mode,
  onModeChange,
  image,
  onImageChange,
  imageScale,
  onImageScaleChange,
  frontText,
  onFrontTextChange,
}: FrontPanelEditorProps) {
  const upd = (patch: Partial<FrontTextContent>) =>
    onFrontTextChange({ ...frontText, ...patch })

  const addBlock = () => {
    const isFirst = frontText.blocks.length === 0
    upd({ blocks: [...frontText.blocks, makeNewBlock(isFirst ? 40 : 24)] })
  }

  const updateBlock = (id: string, patch: Parameters<typeof Object.assign>[1]) =>
    upd({ blocks: frontText.blocks.map(b => (b.id === id ? { ...b, ...patch } : b)) })

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = frontText.blocks.findIndex(b => b.id === id)
    if (idx < 0) return
    const arr = [...frontText.blocks]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    upd({ blocks: arr })
  }

  const removeBlock = (id: string) =>
    upd({ blocks: frontText.blocks.filter(b => b.id !== id) })

  return (
    <div className="space-y-4">
      {/* Section header + mode toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Front of Card</h3>
        <div className="flex gap-0.5 rounded-lg border border-slate-200 p-0.5">
          {(['image', 'text'] as const).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                mode === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'image' ? 'Image' : 'Text'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'image' ? (
        <ImageDropzone
          image={image}
          onImageChange={onImageChange}
          imageScale={imageScale}
          onImageScaleChange={onImageScaleChange}
        />
      ) : (
        <div className="space-y-3">
          {/* Text blocks */}
          {frontText.blocks.map((block, i) => (
            <FrontTextBlockEditor
              key={block.id}
              block={block}
              onChange={patch => updateBlock(block.id, patch)}
              onMoveUp={i > 0 ? () => moveBlock(block.id, -1) : undefined}
              onMoveDown={i < frontText.blocks.length - 1 ? () => moveBlock(block.id, 1) : undefined}
              onRemove={frontText.blocks.length > 1 ? () => removeBlock(block.id) : undefined}
            />
          ))}

          {/* Add block */}
          <button
            onClick={addBlock}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add text block
          </button>

          {/* Vertical position */}
          <div className="space-y-1.5 rounded-md bg-slate-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">↕ Vertical position</span>
              <span className="text-xs text-slate-500">{frontText.verticalOffset}%</span>
            </div>
            <Slider
              value={[frontText.verticalOffset]}
              min={0}
              max={85}
              step={1}
              onValueChange={([v]) => upd({ verticalOffset: v })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
