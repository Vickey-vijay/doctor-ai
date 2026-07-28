// Small inline SVG icon set (no external icon dependency).
// Each icon takes a className for sizing/colour via Tailwind.
import React from 'react'

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  Plus: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Send: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
  ),
  Image: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
  ),
  Chat: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></svg>
  ),
  Grid: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
  ),
  Logout: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
  ),
  Stethoscope: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 3v6a4 4 0 0 0 8 0V3M6 3H4m4 0H8m0 14a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="11" r="2" /></svg>
  ),
  Cross: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" /></svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  Menu: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" /></svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
  ),
}

export default Icon
