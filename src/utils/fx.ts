import type { CotizacionFX, CotizacionDisplay, Moneda } from '../types';

export function cotizacionesToDisplay(
  rates: CotizacionFX[],
  labels?: Record<string, string>
): CotizacionDisplay[] {
  return rates.map(rate => ({
    label: labels?.[`${rate.par}_${rate.tipo}`] ?? `${rate.par} ${rate.tipo}`,
    compra: rate.compra,
    venta: rate.venta,
    tipo: rate.tipo,
  }));
}

export function convertAmount(
  amount: number,
  fromCurrency: Moneda,
  toCurrency: Moneda,
  rates: CotizacionFX[]
): number {
  if (fromCurrency === toCurrency) return amount;
  const par = `${fromCurrency}_${toCurrency}`;
  const rate = rates.find(r => r.par === par);
  if (!rate) {
    throw new Error(`No FX rate found for ${par}`);
  }
  return parseFloat((amount * rate.venta).toFixed(2));
}

export function getLatestRate(
  rates: CotizacionFX[],
  par: string,
  tipo: string
): CotizacionFX | undefined {
  return rates
    .filter(r => r.par === par && r.tipo === tipo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
}
