export const summaryTabToKind = (tabId) => {
  if (tabId === 'day' || tabId === 'daily') return 'daily'
  if (tabId === 'week' || tabId === 'weekly') return 'weekly'
  if (tabId === 'month' || tabId === 'monthly') return 'monthly'
  if (tabId === 'year' || tabId === 'yearly') return 'yearly'
  return 'daily'
}

export const summaryKindToTab = (kind) => {
  if (kind === 'daily') return 'day'
  if (kind === 'weekly') return 'week'
  if (kind === 'monthly') return 'month'
  if (kind === 'yearly') return 'year'
  return 'day'
}
