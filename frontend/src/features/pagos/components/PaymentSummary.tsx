import type { Charge } from "../../../shared/api/contracts";
import { date } from "../../../shared/lib/format";
import { Money } from "../../../shared/ui/Money";

/** Resumen del cargo y del saldo que dejará el importe capturado. Lo usan registrar y corregir. */
export function PaymentSummary({
  charge,
  received,
  balance,
  amount,
}: {
  charge: Charge;
  received: number;
  balance: number;
  amount: number;
}) {
  return (
    <div className="payment-summary full-span">
      <div>
        <span>Concepto</span>
        <strong>{charge.concept}</strong>
      </div>
      <div>
        <span>Vencimiento</span>
        <strong>{date(charge.due)}</strong>
      </div>
      <div>
        <span>Total</span>
        <strong>
          <Money value={charge.total} />
        </strong>
      </div>
      <div>
        <span>Recibido</span>
        <strong>
          <Money value={received} />
        </strong>
      </div>
      <div>
        <span>Saldo actual</span>
        <strong>
          <Money value={balance} />
        </strong>
      </div>
      <div>
        <span>Saldo resultante</span>
        <strong>
          <Money value={Math.max(0, balance - amount)} />
        </strong>
      </div>
    </div>
  );
}
