'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type ImageDetail = {
  id: string
  url: string
}

export function VehicleGallery({ images, name }: { images: ImageDetail[], name: string }) {
  const [activeUrl, setActiveUrl] = useState(images[0]?.url || '')

  if (images.length === 0) {
    return (
      <div className="aspect-video w-full border-[6px] border-[#0B1B3D] shadow-[12px_12px_0_#0F1E32] overflow-hidden flex items-center justify-center bg-muted text-[#0B1B3D]/20 font-black">
        IMAGE PENDING
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video w-full border-[6px] border-[#0B1B3D] shadow-[12px_12px_0_#0F1E32] overflow-hidden group bg-muted">
        <Image
          src={activeUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          sizes="(max-width: 1024px) 100vw, 80vw"
        />
      </div>
      
      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((img) => (
            <button 
              key={img.id} 
              onClick={() => setActiveUrl(img.url)}
              className={cn(
                "aspect-video border-2 overflow-hidden transition-all duration-200",
                activeUrl === img.url 
                  ? "border-[#F8991D] scale-95 shadow-[2px_2px_0_#F8991D]" 
                  : "border-[#0B1B3D]/10 hover:border-[#0B1B3D]/30"
              )}
            >
              <Image 
                src={img.url} 
                alt="" 
                width={150} 
                height={100} 
                className={cn("w-full h-full object-cover", activeUrl !== img.url && "opacity-60 hover:opacity-100")} 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
