export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

export const formatDate = (value: string, includeYear = false) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' as const } : {}), timeZone: 'UTC',
}).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))

export const statusClass = (status: string) => status.toLowerCase().replaceAll(' ', '-')

export const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('')
