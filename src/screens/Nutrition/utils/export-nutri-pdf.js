import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getState } from '../store-nutri';

export async function exportNutriPDF() {
  const st = await getState();
  const rows = (st.items || []).map(i => {
    const dt = new Date(i.ts).toLocaleString();
    if (i.type === 'meal') {
      return `<div class="row">
        <b>Repas</b> — ${dt}<br/>
        ${i.food} — ${i.kcal} kcal — ${i.amount} g ${i.protein ? `— prot ${i.protein} g` : ''}
        ${i.note ? `<div>${i.note}</div>` : ''}
      </div>`;
    }
    return `<div class="row"><b>Eau</b> — ${dt}<br/>${i.ml} ml ${i.note ? `— ${i.note}` : ''}</div>`;
  }).join('');

  const html = `
    <html><head><meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #7d4ac5; }
        .row { border-bottom:1px solid #eee; padding:8px 0; }
      </style>
    </head><body>
      <h1>Journal Nutrition & Hydratation</h1>
      ${rows || '<i>Aucune donnée.</i>'}
    </body></html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
}
