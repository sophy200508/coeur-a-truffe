import * as FileSystem from 'expo-file-system';
import { Share, Alert } from 'react-native';

export async function exportVetCSV(items = []) {
  try {
    const headers = [
      'date', 'type', 'vet', 'reason', 'cost', 'product', 'nextDate', 'weight(kg)', 'note'
    ];
    const rows = items.map(it => ([
      new Date(it.ts).toISOString(),
      it.type || '',
      it.vet || '',
      it.reason || '',
      it.cost ?? '',
      it.product || '',
      it.nextDate ? new Date(it.nextDate).toISOString().slice(0,10) : '',
      it.weight ?? '',
      (it.note || '').replace(/\r?\n/g, ' ')
    ]));

    const csv = [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const uri = FileSystem.cacheDirectory + `vet_export_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Share.share({ url: uri, message: 'Export vétérinaire (.csv)', title: 'Export vétérinaire' });
  } catch (e) {
    Alert.alert('Erreur', 'Impossible de créer le CSV.');
  }
}
