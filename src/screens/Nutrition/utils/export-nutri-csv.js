import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getState } from '../store-nutri';

export async function exportNutriCSV() {
  const st = await getState();
  const items = st.items || [];
  const header = ['Date','Type','Aliment','kcal','grammes','protéines(g)','eau(ml)','Note'];
  const rows = items.map(i => {
    const d = new Date(i.ts).toLocaleString();
    if (i.type === 'meal') {
      return [
        d, 'Repas', i.food || '', i.kcal || 0, i.amount || 0, i.protein || 0, '', i.note ? `"${String(i.note).replace(/"/g,'""')}"` : ''
      ].join(',');
    }
    return [
      d, 'Eau', '', '', '', '', i.ml || 0, i.note ? `"${String(i.note).replace(/"/g,'""')}"` : ''
    ].join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const path = FileSystem.documentDirectory + 'journal-nutrition.csv';
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(path, { mimeType: 'text/csv' });
}
