import { useCotizaciones } from '../hooks/useCotizaciones';
import { formatCurrency } from '../utils/formatters';
import { Card } from './common/ui/Card';
import { Badge } from './common/ui/Badge';

export default function CotizacionesView() {
  const { rates, loading } = useCotizaciones();

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-stone-400">Cargando cotizaciones...</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-2xl font-bold text-stone-900">Cotizaciones</h1>
      {rates.length === 0 ? (
        <p className="text-stone-400 text-center py-10">No hay cotizaciones disponibles</p>
      ) : (
        rates.map(rate => (
          <Card key={`${rate.par}-${rate.tipo}-${rate.id}`} padding="sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-stone-800">{rate.par}</p>
                <Badge variant="navy">{rate.tipo}</Badge>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-stone-600">Compra: <span className="font-bold text-stone-900">{formatCurrency(rate.compra, rate.par.split('_')[1] as 'ARS' | 'USD' | 'BRL')}</span></p>
                <p className="text-sm text-stone-600">Venta: <span className="font-bold text-stone-900">{formatCurrency(rate.venta, rate.par.split('_')[1] as 'ARS' | 'USD' | 'BRL')}</span></p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
