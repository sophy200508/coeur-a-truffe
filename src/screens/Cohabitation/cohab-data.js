// Catégories / contextes de cohabitation
export const COHAB_CATEGORIES = ['Maison', 'Extérieur', 'Invités'];

// Routines / règles proposées
const DATA = [
  {
    id: 'M1',
    title: 'Attendre à la porte',
    category: 'Maison',
    level: 'Débutant',
    goal: 'Ouvrir 10 cm sans se précipiter',
    tips: 'Micro-ouvertures + récompense du calme, refermer si avance.',
    steps: ['Laisse fermée', 'Poignée → ouvrir 5–10 cm', 'Récompenser l’attente', 'Fermer si mouvement'],
  },
  {
    id: 'M2',
    title: 'Repos sur le tapis',
    category: 'Maison',
    level: 'Équilibré',
    goal: '10 min de repos détendu',
    tips: 'Tapis dédié, masticable, calme renforcé.',
    steps: ['Aller au tapis', 'Down', 'Récompenses espacées', 'Libération calme'],
  },
  {
    id: 'I1',
    title: 'Accueillir sans sauter',
    category: 'Invités',
    level: 'Débutant',
    goal: 'Contact 10 s sans saut',
    tips: 'Ignorer les sauts, renforcer 4 pattes au sol.',
    steps: ['Laisse si besoin', 'Approche latérale', 'Récompense quand 4 pattes', 'Pause si excitation'],
  },
  {
    id: 'E1',
    title: 'Croiser des passants',
    category: 'Extérieur',
    level: 'Équilibré',
    goal: 'Laisse détendue au croisement',
    tips: 'Courbe large, marquage du calme.',
    steps: ['Repérer la personne', 'Créer de la distance', 'Récompenser le focus', 'Relâcher la laisse'],
  },
  {
    id: 'M3',
    title: 'Gestion des ressources',
    category: 'Maison',
    level: 'Expert',
    goal: 'Échanges sereins (laisser-venir)',
    tips: 'Swaps riches, jamais d’arrachage.',
    steps: ['Présenter échange', 'Attendre relâchement', 'Récompenser', 'Rendre souvent'],
  },
];

export default DATA;
