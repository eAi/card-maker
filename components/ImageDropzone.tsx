'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface ImageDropzoneProps {
  image: string | null
  onImageChange: (image: string | null) => void
  imageScale: number
  onImageScaleChange: (scale: number) => void
}

export default function ImageDropzone({
  image,
  onImageChange,
  imageScale,
  onImageScaleChange,
}: ImageDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        onImageChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [onImageChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange(null)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">Front Image</label>

      {image ? (
        <div className="space-y-4">
          <div className="relative">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                src={image}
                alt="Card front"
                className="h-full w-full object-contain"
                style={{ transform: `scale(${imageScale / 100})` }}
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Image scale slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Image Scale</label>
              <span className="text-sm text-slate-500">{imageScale}%</span>
            </div>
            <Slider
              value={[imageScale]}
              onValueChange={(value) => onImageScaleChange(value[0])}
              min={50}
              max={150}
              step={5}
            />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragActive
              ? 'border-slate-400 bg-slate-100'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mb-2 h-8 w-8 text-slate-400" />
          <p className="text-center text-sm text-slate-600">
            {isDragActive ? (
              'Drop the image here'
            ) : (
              <>
                Drag & drop an image, or <span className="text-slate-900 underline">browse</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            JPG, PNG, HEIC, WebP and more
          </p>
        </div>
      )}
    </div>
  )
}
