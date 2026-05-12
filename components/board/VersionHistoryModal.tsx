'use client'

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface VersionHistoryModalProps {
  boardId: string
  fabricRef: React.MutableRefObject<any>
  onClose: () => void
}

export default function VersionHistoryModal({ boardId, fabricRef, onClose }: VersionHistoryModalProps) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Try to fetch history from API; if unavailable, show empty list (skeleton)
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}/history`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setSnapshots(data || [])
      } catch {
        // ignore — backend may not exist yet
      }
    })()
    return () => { mounted = false }
  }, [boardId])

  const handleRestore = async (snapshot: any) => {
    if (!fabricRef?.current) {
      toast.error('Canvas not ready')
      return
    }
    setLoading(true)
    try {
      // If snapshot contains json, load it
      if (snapshot.json) {
        fabricRef.current.loadFromJSON(snapshot.json, () => {
          fabricRef.current.renderAll()
          toast.success('Restored snapshot')
          setLoading(false)
          onClose()
        })
      } else {
        toast.error('Snapshot format unsupported')
        setLoading(false)
      }
    } catch {
      setLoading(false)
      toast.error('Restore failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-white shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Version History</h3>
          <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-white/55 hover:bg-[#2a2a2a] hover:text-white">Close</button>
        </div>
        <div className="space-y-2 max-h-96 overflow-auto">
          {snapshots.length === 0 ? (
            <div className="rounded-lg bg-[#0f0f0f] p-3 text-sm text-white/50">No saved versions available.</div>
          ) : (
            snapshots.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div>
                  <div className="text-sm font-medium">{s.name ?? `Snapshot ${i + 1}`}</div>
                  <div className="text-xs text-white/45">{s.created_at ?? ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRestore(s)} disabled={loading} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Restore</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
