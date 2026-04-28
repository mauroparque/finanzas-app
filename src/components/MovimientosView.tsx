import { useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatters';
import { Badge } from './common/ui/Badge';
import { Card } from './common/ui/Card';

export default function MovimientosView() {
  const filters = useMemo(() => ({ month: new Date() }), []);
  const { transactions, loading } = useTransactions(filters);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-stone-400">Cargando...</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-2xl font-bold text-stone-900">Movimientos</h1>
      {transactions.length === 0 ? (
        <p className="text-stone-400 text-center py-10">No hay movimientos este mes</p>
      ) : (
        transactions.map(tx => (
          <Card key={tx.id} padding="sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-stone-800">{tx.detalle || tx.concepto}</p>
                <p className="text-xs text-stone-500">{tx.categoria} • {tx.medio_pago}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.tipo === 'ingreso' ? 'text-sage-600' : 'text-stone-900'}`}>
                  {tx.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(tx.monto, tx.moneda)}
                </p>
                <Badge variant={tx.tipo === 'ingreso' ? 'sage' : 'default'}>
                  {tx.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </Badge>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
