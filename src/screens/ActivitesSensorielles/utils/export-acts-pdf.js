import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getState } from '../store-acts';
import DATA from '../activities-data';

export async function exportActsPDF() {
  const st = await getState();
  const sessions = st.sessions || [];

  const html = `
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #7d4ac5; }
        .sess { margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Journal Activités sensorielles</h1>
      ${sessions
        .map((s) => {
          const act =
            s.activityId === '_sequence'
              ? 'Parcours 3 activités'
              : DATA.find((a) => a.id === s.activityId)?.title || s.activityId;
          return `
            <div class="sess">
              <b>${act}</b><br/>
              ${new Date(s.ts).toLocaleString()} • ${s.durationMin} min
              ${s.notes ? `<div>${s.notes}</div>` : ''}
            </div>`;
        })
        .join('')}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
}
