export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatShortDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};