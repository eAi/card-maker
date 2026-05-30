'use client'

import React, { useState, useEffect } from 'react'
import {
  CARD_SIZES,
  CUSTOM_SIZE_CONSTRAINTS,
  validateCustomSize,
  createCustomSize,
  type CardSize,
} from '@/lib/cardSizes'

interface SizeSelectorProps {
  selectedSize: string
  onSizeChange: (sizeId: string) => void
  customSize: CardSize | null
  onCustomSizeChange: (size: CardSize | null) => void
}

export default function SizeSelector({
  selectedSize,
  onSizeChange,
  customSize,
  onCustomSizeChange,
}: SizeSelectorProps) {
  const [customWidth, setCustomWidth] = useState(100)
  const [customHeight, setCustomHeight] = useState(100)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Update custom size when dimensions change
  useEffect(() => {
    if (selectedSize === 'custom') {
      const validation = validateCustomSize(customWidth, customHeight)
      if (validation.valid) {
        setValidationError(null)
        onCustomSizeChange(createCustomSize(customWidth, customHeight))
      } else {
        setValidationError(validation.error || null)
      }
    }
  }, [customWidth, customHeight, selectedSize, onCustomSizeChange])

  const handleCustomSelect = () => {
    onSizeChange('custom')
    const validation = validateCustomSize(customWidth, customHeight)
    if (validation.valid) {
      onCustomSizeChange(createCustomSize(customWidth, customHeight))
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">Card Size</label>
      <div className="grid grid-cols-2 gap-2">
        {CARD_SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => onSizeChange(size.id)}
            className={`rounded-lg border-2 p-3 text-left transition-colors ${
              selectedSize === size.id
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="font-medium text-slate-900">{size.name}</div>
            <div className="text-xs text-slate-500">
              {size.width} × {size.height}mm
            </div>
          </button>
        ))}

        {/* Custom size button */}
        <button
          type="button"
          onClick={handleCustomSelect}
          className={`col-span-2 rounded-lg border-2 p-3 text-left transition-colors ${
            selectedSize === 'custom'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="font-medium text-slate-900">Custom Size</div>
          <div className="text-xs text-slate-500">
            Enter your own dimensions
          </div>
        </button>
      </div>

      {/* Custom size inputs */}
      {selectedSize === 'custom' && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Width (mm)
              </label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                min={CUSTOM_SIZE_CONSTRAINTS.minWidth}
                max={CUSTOM_SIZE_CONSTRAINTS.maxWidth}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Height (mm)
              </label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                min={CUSTOM_SIZE_CONSTRAINTS.minHeight}
                max={CUSTOM_SIZE_CONSTRAINTS.maxHeight}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Max: {CUSTOM_SIZE_CONSTRAINTS.maxWidth} × {CUSTOM_SIZE_CONSTRAINTS.maxHeight}mm
          </p>
          {validationError && (
            <p className="text-xs text-red-600">{validationError}</p>
          )}
        </div>
      )}
    </div>
  )
}
