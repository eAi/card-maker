'use client'

import React from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FONT_CATEGORIES,
  getFontsByCategory,
  getFontFamilyValue,
  loadFont,
  loadAllFontPreviews,
} from '@/lib/fonts'

const fontsByCategory = getFontsByCategory()

interface FontPickerProps {
  /** CSS font-family string, e.g. "'Playfair Display', serif" */
  value: string
  /** Called with the plain family name, e.g. "Playfair Display" */
  onChange: (fontFamily: string) => void
  triggerClassName?: string
}

export default function FontPicker({ value, onChange, triggerClassName }: FontPickerProps) {
  const currentFontName = value.split("'")[1] ?? value.split(',')[0].trim()

  const handleOpenChange = (open: boolean) => {
    if (open) loadAllFontPreviews()
  }

  const handleValueChange = async (family: string) => {
    await loadFont(family)
    onChange(family)
  }

  return (
    <Select onValueChange={handleValueChange} onOpenChange={handleOpenChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={currentFontName}>
          <span style={{ fontFamily: value }}>{currentFontName}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {FONT_CATEGORIES.map(cat => (
          <SelectGroup key={cat.id}>
            <SelectLabel className="text-xs uppercase tracking-wider text-slate-400">
              {cat.label}
            </SelectLabel>
            {fontsByCategory[cat.id]?.map(font => (
              <SelectItem
                key={font.family}
                value={font.family}
                style={{ fontFamily: getFontFamilyValue(font.family) }}
              >
                {font.family}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
