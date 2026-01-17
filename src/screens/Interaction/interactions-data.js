// Catégories + types d'interactions proposées
export const INTER_CATEGORIES = ['Humains', 'Chiens', 'Environnement'];

const DATA = [
  { id: 'H1', title: 'Saluer calmement un humain', category: 'Humains', level: 'Débutant', goal: 'Rester posé 10s', tips: 'Approche en arc, renforcement calme.' },
  { id: 'H2', title: 'Rester couché près d’invités', category: 'Humains', level: 'Équilibré', goal: '2 x 1 min', tips: 'Tapis + récompenses espacées.' },
  { id: 'C1', title: 'Croisement d’un chien en laisse', category: 'Chiens', level: 'Débutant', goal: 'Passage sans tension', tips: 'Courbe large + focus sur toi.' },
  { id: 'C2', title: 'Jeu libre supervisé', category: 'Chiens', level: 'Équilibré', goal: '3 min de jeu ok', tips: 'Pause si excitation ↑.' },
  { id: 'E1', title: 'Terrasse calme', category: 'Environnement', level: 'Débutant', goal: '2 x 3 min', tips: 'Installer tapis + masticable.' },
  { id: 'E2', title: 'Marché / rue passante', category: 'Environnement', level: 'Expert', goal: '5–10 min calme', tips: 'Exposition graduelle, sorties courtes.' },
];

export default DATA;
