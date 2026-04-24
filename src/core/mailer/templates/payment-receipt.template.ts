export interface PaymentReceiptData {
  to: string;
  productName: string;
  amountInCents: number;
  currency: string;
  transactionId: string;
  billingAddress: {
    name: string;
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country: string;
  };
  paymentDate: Date;
}

export function paymentReceiptHtml(data: PaymentReceiptData): string {
  const amount = (data.amountInCents / 100).toFixed(2);
  const currency = data.currency.toUpperCase();
  const date = data.paymentDate.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f8fafc; margin:0; padding:2rem; color:#1e293b; }
  .container { max-width:560px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .header { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:2rem; text-align:center; color:white; }
  .header h1 { margin:0; font-size:1.6rem; }
  .body { padding:2rem; }
  .check { font-size:3rem; text-align:center; margin-bottom:1rem; }
  h2 { color:#6366f1; font-size:1.1rem; margin:1.5rem 0 .75rem; }
  .row { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid #f1f5f9; font-size:.95rem; }
  .row .label { color:#64748b; }
  .row .value { font-weight:600; }
  .total { background:#f8fafc; border-radius:8px; padding:1rem; margin:1rem 0; }
  .total .row { font-size:1.05rem; }
  .total .value { color:#6366f1; font-size:1.2rem; }
  .address-box { background:#f8fafc; border-radius:8px; padding:1rem; font-size:.9rem; line-height:1.8; color:#475569; }
  .footer { text-align:center; padding:1.5rem 2rem; background:#f8fafc; color:#94a3b8; font-size:.82rem; }
</style></head><body>
<div class="container">
  <div class="header"><h1>ClashChat</h1><p style="margin:.35rem 0 0;opacity:.85">Confirmation de paiement</p></div>
  <div class="body">
    <div class="check">OK</div>
    <p style="text-align:center;font-size:1.1rem">Merci <strong>${data.billingAddress.name}</strong> pour votre achat !</p>
    <h2>Récapitulatif de commande</h2>
    <div class="row"><span class="label">Produit</span><span class="value">${data.productName}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
    <div class="row"><span class="label">N° transaction</span><span class="value" style="font-size:.8rem;font-family:monospace">${data.transactionId}</span></div>
    <div class="total"><div class="row"><span class="label">Total payé</span><span class="value">${amount} ${currency}</span></div></div>
    <h2>Adresse de facturation</h2>
    <div class="address-box">
      <strong>${data.billingAddress.name}</strong><br>
      ${data.billingAddress.line1}<br>
      ${data.billingAddress.line2 ? data.billingAddress.line2 + '<br>' : ''}
      ${data.billingAddress.postalCode} ${data.billingAddress.city}<br>
      ${data.billingAddress.country}
    </div>
  </div>
  <div class="footer">© 2026 ClashChat</div>
</div>
</body></html>`;
}
