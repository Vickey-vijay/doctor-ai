// App shell: persistent sidebar + routed main panel. Owns the session list state and
// shares it with child routes (Chat / Dashboard) through the router Outlet context.
import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { sessionsApi } from '../api/client'

export default function AppLayout() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  // Sidebar is always-visible at md+ (CSS handles that); below md it's an off-canvas
  // drawer toggled by this flag from the hamburger button in each page header.
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refreshSessions = useCallback(async () => {
    try {
      const data = await sessionsApi.list()
      setSessions(data)
      return data
    } catch {
      return []
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => { refreshSessions() }, [refreshSessions])

  // Close the drawer on Escape while it's open.
  useEffect(() => {
    if (!sidebarOpen) return
    function onKey(e) { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  function openSession(id) {
    setActiveId(id)
    navigate('/')
    closeSidebar()
  }
  function newChat() {
    setActiveId(null)
    navigate('/')
    closeSidebar()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        loading={loadingSessions}
        onOpenSession={openSession}
        onNewChat={newChat}
        onRefresh={refreshSessions}
        open={sidebarOpen}
        onClose={closeSidebar}
      />
      <main className="flex-1 overflow-hidden">
        <Outlet context={{ sessions, activeId, setActiveId, refreshSessions, openSession, newChat, toggleSidebar }} />
      </main>
    </div>
  )
}
