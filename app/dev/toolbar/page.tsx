"use client"

import React, { useRef } from 'react'
import dynamic from 'next/dynamic'
import type { fabric } from 'fabric'

const BottomToolbar = dynamic(() => import('@/components/ui/BottomToolbar'), { ssr: false })

export default function ToolbarPreview() {
  const fabricRef = useRef<fabric.Canvas | null>(null)

  return (
    <div className="h-screen w-screen bg-[#f7f5f0]">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="mb-4 text-2xl font-semibold">Toolbar Preview (Dev)</h1>
        <p className="mb-6 text-sm text-[#0d0d0d]/60">This page previews the desktop and mobile toolbar UI. Resize the window or use device emulation to test.</p>
      </div>

      {/* fake canvas area */}
      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0 z-10 bg-white" />
        <BottomToolbar fabricRef={fabricRef} onUndo={() => {}} onRedo={() => {}} onDeleteSelected={() => {}} onClear={() => {}} canEdit={true} />
      </div>
    </div>
  )
}
