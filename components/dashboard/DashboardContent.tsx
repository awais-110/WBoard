'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import BoardGrid from './BoardGrid'
import NewBoardModal from './NewBoardModal'
import { Filter, Plus, Search, Sparkles, Users } from 'lucide-react'
import type { DashboardBoard } from '@/types/board'

interface DashboardContentProps {
  boards: DashboardBoard[]
  sharedBoards?: DashboardBoard[]
}

/**
 * Dashboard content with board grid and new board modal.
 */
export default function DashboardContent({ boards, sharedBoards = [] }: DashboardContentProps) {
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<'all' | 'owned' | 'shared'>('all')
  const totalBoards = boards.length + sharedBoards.length
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const matchesQuery = useMemo(
    () => (board: DashboardBoard) =>
      !normalizedQuery || board.title.toLowerCase().includes(normalizedQuery),
    [normalizedQuery]
  )

  const visibleOwnedBoards = boards.filter(
    (board) => matchesQuery(board) && (accessFilter === 'all' || accessFilter === 'owned')
  )
  const visibleSharedBoards = sharedBoards.filter(
    (board) => matchesQuery(board) && (accessFilter === 'all' || accessFilter === 'shared')
  )

  const recentBoards = [...boards, ...sharedBoards]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4DDD3]/20 via-white to-[#E4DDD3]/10 text-slate-900">
      <header className="border-b border-[#00A198]/10 bg-gradient-to-r from-white/60 to-[#E4DDD3]/30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00A198]/30 bg-gradient-to-r from-[#00A198]/20 to-[#00A198]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.32em] text-[#008B7A] shadow-sm">
                <Sparkles size={14} />
                Workspaces
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-[#008B7A] via-[#00A198] to-[#009E8A] bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                  My Boards
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Keep active work visible, open a board fast, and create new spaces when you need them.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="hidden rounded-2xl border border-[#00A198]/20 bg-gradient-to-br from-white to-[#E4DDD3]/20 px-4 py-3 shadow-sm sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#00A198]">Boards</p>
                <p className="text-2xl font-bold text-[#008B7A]">
                  {totalBoards}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-[#00A198]/20 bg-gradient-to-br from-white to-[#E4DDD3]/20 px-4 py-3 shadow-sm sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#00A198]">Shared</p>
                <p className="flex items-center gap-1 text-2xl font-bold text-[#008B7A]">
                  <Users size={16} />
                  {sharedBoards.length}
                </p>
              </div>
              <div className="inline-flex flex-wrap gap-3">
                <button
                  onClick={() => setShowNewModal(true)}
                  className="group inline-flex items-center gap-2 rounded-full border border-[#00A198]/30 bg-gradient-to-r from-[#00A198] to-[#009E8A] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00A198]/30 transition hover:shadow-xl hover:shadow-[#00A198]/50"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition duration-300" />
                  New Board
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="group rounded-3xl border border-[#00A198]/20 bg-gradient-to-br from-white/80 to-[#E4DDD3]/30 p-4 shadow-md shadow-[#00A198]/5 transition hover:shadow-lg hover:shadow-[#00A198]/10">
              <div className="flex items-center gap-3 rounded-full border border-[#00A198]/20 bg-white/60 px-4 py-2.5">
                <Search size={18} className="text-[#00A198]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search boards..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-[#00A198]/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="rounded-3xl border border-[#00A198]/20 bg-gradient-to-br from-white/80 to-[#E4DDD3]/30 p-4 shadow-md shadow-[#00A198]/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#008B7A]">
                  <Filter size={18} />
                  <span className="text-sm font-bold">Filter</span>
                </div>
                <span className="rounded-full border border-[#00A198]/20 bg-[#00A198]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#008B7A]">
                  {accessFilter}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', 'owned', 'shared'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAccessFilter(option)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${accessFilter === option ? 'border-[#00A198] bg-gradient-to-r from-[#00A198] to-[#009E8A] text-white shadow-md shadow-[#00A198]/30' : 'border-[#00A198]/20 bg-white text-[#008B7A] hover:border-[#00A198]/40 hover:bg-[#E4DDD3]/20'}`}
                  >
                    {option === 'all' ? 'All' : option === 'owned' ? 'Owned' : 'Shared'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="group rounded-3xl border border-[#00A198]/15 bg-gradient-to-br from-[#E4DDD3]/40 to-white/60 p-6 shadow-md shadow-[#00A198]/5 transition hover:border-[#00A198]/25 hover:shadow-lg hover:shadow-[#00A198]/10">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-br from-[#00A198] to-[#008B7A] p-3 text-white">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#008B7A]">Quick actions</p>
                  <p className="mt-2 text-sm text-[#00A198]/70">Create a new board, invite collaborators, and manage your workspace from one place.</p>
                </div>
              </div>
            </div>
            <div className="group rounded-3xl border border-[#00A198]/15 bg-gradient-to-br from-[#E4DDD3]/40 to-white/60 p-6 shadow-md shadow-[#00A198]/5 transition hover:border-[#00A198]/25 hover:shadow-lg hover:shadow-[#00A198]/10">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-br from-[#00A198] to-[#008B7A] p-3 text-white">
                  <Users size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#008B7A]">Collaboration</p>
                  <p className="mt-2 text-sm text-[#00A198]/70">Shared boards let your team work together in real time. Use invites to bring others into your workflow.</p>
                </div>
              </div>
            </div>
            <div className="group rounded-3xl border border-[#00A198]/15 bg-gradient-to-br from-[#E4DDD3]/40 to-white/60 p-6 shadow-md shadow-[#00A198]/5 transition hover:border-[#00A198]/25 hover:shadow-lg hover:shadow-[#00A198]/10">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-br from-[#00A198] to-[#008B7A] p-3 text-white">
                  <Filter size={18} />
                </div>
                <div>
                  <p className="font-bold text-[#008B7A]">Export & history</p>
                  <p className="mt-2 text-sm text-[#00A198]/70">Export board snapshots or review change history while keeping your ideas safe and versioned.</p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-3xl border border-[#00A198]/20 bg-gradient-to-br from-[#E4DDD3]/30 to-white/50 p-6 shadow-md shadow-[#00A198]/5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#008B7A]">Recent activity</p>
                <p className="mt-1 text-sm text-[#00A198]/70">Your most recently opened or updated boards.</p>
              </div>
              <span className="rounded-full border border-[#00A198]/30 bg-[#00A198]/10 px-3 py-1 text-xs font-bold text-[#008B7A]">
                {recentBoards.length} updates
              </span>
            </div>

            <div className="space-y-3">
              {recentBoards.length > 0 ? (
                recentBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/dashboard/board/${board.id}`}
                    className="group block rounded-2xl border border-[#00A198]/20 bg-gradient-to-r from-white to-[#E4DDD3]/20 p-4 shadow-sm transition hover:border-[#00A198]/40 hover:from-white hover:to-[#E4DDD3]/40 hover:shadow-md hover:shadow-[#00A198]/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#008B7A] group-hover:text-[#00A198]">{board.title}</p>
                        <p className="mt-1 text-xs text-[#00A198]/60">
                          {board.access === 'owned' ? 'Owned by you' : `Shared as ${board.role ?? 'editor'}`} · Updated {new Date(board.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${board.access === 'owned' ? 'border-[#00A198]/30 bg-[#00A198]/15 text-[#008B7A]' : 'border-rose-200/50 bg-rose-100/30 text-rose-700'}`}>
                        {board.access === 'owned' ? 'Owned' : 'Shared'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#00A198]/20 bg-white/40 p-4 text-sm text-[#00A198]/60">
                  No recent boards yet — start a new board or open one from your workspace.
                </div>
              )}
            </div>
          </section>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <section>
          <SectionHeader
            title="Owned by me"
            description="Boards you created and can manage."
            count={visibleOwnedBoards.length}
          />
          <BoardGrid boards={visibleOwnedBoards} emptyTitle={totalBoards ? 'No owned boards match your search' : 'No boards yet'} emptyDescription={totalBoards ? 'Try a different search or filter.' : 'Create your first whiteboard and start sketching ideas with your team.'} />
        </section>

        {visibleSharedBoards.length > 0 && (
          <section>
            <SectionHeader
              title="Shared with me"
              description="Boards where another workspace member added you as a collaborator."
              count={visibleSharedBoards.length}
            />
            <BoardGrid boards={visibleSharedBoards} allowDelete={false} emptyTitle="No shared boards match your search" emptyDescription="Try a different search or filter." />
          </section>
        )}
      </main>

      {/* Modals */}
      {showNewModal && <NewBoardModal onClose={() => setShowNewModal(false)} />}
    </div>
  )
}

function SectionHeader({ title, description, count }: { title: string; description: string; count: number }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-[#008B7A]">{title}</h2>
        <p className="mt-1 text-sm text-[#00A198]/60">{description}</p>
      </div>
      <span className="rounded-full border border-[#00A198]/20 bg-[#00A198]/10 px-4 py-1.5 text-xs font-bold text-[#008B7A] shadow-sm">
        {count} board{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
