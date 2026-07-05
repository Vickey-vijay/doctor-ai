// Single source of truth for the three urgency tiers — colours, labels, icons.
// Colours match the non-negotiable MediQuick AI urgency system.
export const URGENCY = {
  self_care: {
    key: 'self_care',
    label: 'Manageable at Home',
    short: 'Self-care',
    icon: '✓',
    color: '#16a34a',
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    badge: 'bg-green-600',
    ring: 'ring-green-500',
  },
  consult_doctor: {
    key: 'consult_doctor',
    label: 'See a Doctor Soon',
    short: 'Consult a doctor',
    icon: '⚠',
    color: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
    badge: 'bg-amber-600',
    ring: 'ring-amber-500',
  },
  seek_emergency: {
    key: 'seek_emergency',
    label: 'Seek Emergency Care',
    short: 'Emergency',
    icon: '🚨',
    color: '#dc2626',
    bg: 'bg-red-50',
    border: 'border-red-600',
    text: 'text-red-700',
    badge: 'bg-red-600',
    ring: 'ring-red-500',
  },
}

export function urgencyMeta(tier) {
  return URGENCY[tier] || URGENCY.consult_doctor
}
