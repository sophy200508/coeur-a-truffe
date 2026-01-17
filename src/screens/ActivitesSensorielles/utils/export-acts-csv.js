import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getState } from '../store-acts';
import DATA from '../activities-data';

export async function exportActsCSV() {
  const st = await getState();
  const sessions = st.sessions || [];

  const header = ['Date', 'Activité', 'Durée (min)', 'Notes'];
  const rows = sessions.map((s) => {
    const act =
      s.activityId === '_sequence'
        ? 'Parcours 3 activités'
        : DATA.find((a) => a.id === s.activityId)?.title || s.activityId;
    return [
      new Date(s.ts).toLocaleString(),
      act,
      s.durationMin,
      s.notes ? `"${s.notes.replace(/"/g, '""')}"` : '',
    ].join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const path = FileSystem.documentDirectory + 'journal-activites.csv';
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  await Sharing.shareAsync(path, { mimeType: 'text/csv' });
}
