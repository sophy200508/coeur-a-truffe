// src/screens/MoiEtMonChien/utils/export-pdf.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAll } from '../store-moi';

function esc(s=''){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

export async function exportJournalHealthPDF() {
  const data = await getAll();
  const journal = data.journal || [];
  const health  = data.health  || [];

  const jHtml = journal.map(j => `
    <div class="card">
      <div class="muted">${new Date(j.ts).toLocaleString()}</div>
      <div>${esc(j.text)}</div>
    </div>`).join('');

  const hHtml = health.map(h => `
    <div class="card">
      <div class="row"><b>${esc(h.type)}</b><span class="muted">${esc(h.dateISO)}</span></div>
      ${h.notes ? `<div>${esc(h.notes)}</div>` : ''}
    </div>`).join('');

  const html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body{ font-family: -apple-system, Roboto, Arial; padding:24px; }
      h1{ color:#4a235a; } h2{ color:#6b3fa3; }
      .card{ border:1px solid #eee; border-radius:12px; padding:12px; margin:10px 0; }
      .muted{ color:#777; font-size:12px; }
      .row{ display:flex; justify-content:space-between; align-items:center; }
    </style>
  </head>
  <body>
    <h1>Cœur à truffe — Journal & Santé</h1>
    <h2>Journal</h2>
    ${jHtml || '<div class="muted">Aucune entrée.</div>'}
    <h2>Suivi santé</h2>
    ${hHtml || '<div class="muted">Aucun enregistrement.</div>'}
  </body>
  </html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exporter PDF' });
  }
  return uri;
}
