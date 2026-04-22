const currencyFormatters: Record<string, Intl.NumberFormat> = {};

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  if (!currencyFormatters[currency]) {
    const localeMap: Record<string, string> = {
      ARS: 'es-AR',
      USD: 'en-US',
      USDT: 'en-US',
      BRL: 'pt-BR',
    };
    currencyFormatters[currency] = new Intl.NumberFormat(localeMap[currency] ?? 'es-AR', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return currencyFormatters[currency];
}

export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return getCurrencyFormatter(currency).format(amount);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
