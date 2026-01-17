export const CATEGORIES = ['Bases', 'Rappel', 'Laisse', 'Calme', 'Tricks'];

const DATA = [
  {
    id: 'sit',
    title: 'Assis',
    category: 'Bases',
    level: 'Débutant',
    targetSuccess: 20,
    steps: [
      'Leurre la tête vers le haut, fesses au sol.',
      'Click/“Oui” puis récompense.',
      'Ajoute le mot “Assis” quand fiable.',
      'Généralise (pièces, contextes).'
    ],
    tips: 'Courtes sessions (1–2 min), 5–7 répétitions, arrête avant la fatigue.'
  },
  {
    id: 'down',
    title: 'Couché',
    category: 'Bases',
    level: 'Débutant',
    targetSuccess: 20,
    steps: [
      'Depuis Assis, mène la friandise au sol.',
      'Click/“Oui”, récompense au sol.',
      'Ajoute le signal “Couché”.',
      'Augmente la durée 1 → 3 → 5s.'
    ],
    tips: 'Récompense à hauteur du sol pour garder la position.'
  },
  {
    id: 'stay',
    title: 'Reste',
    category: 'Calme',
    level: 'Équilibré',
    targetSuccess: 30,
    steps: [
      'Position de base (assis/couché).',
      'Micro-durée (1–2s) puis libération (“OK”).',
      'Ajoute distance et distractions séparément.',
      'Mélange durée/distance une fois stable.'
    ],
    tips: 'Une seule difficulté à la fois (durée OU distance OU distraction).'
  },
  {
    id: 'recall',
    title: 'Rappel',
    category: 'Rappel',
    level: 'Équilibré',
    targetSuccess: 40,
    steps: [
      'Courte distance en intérieur, super récompense.',
      'Ajoute longe en extérieur calme.',
      'Augmente distance / distractions.',
      'Entretiens régulièrement (jeux de rappel).'
    ],
    tips: 'Toujours gagner : jamais punir après un rappel.'
  },
  {
    id: 'loose-leash',
    title: 'Marche en laisse détendue',
    category: 'Laisse',
    level: 'Équilibré',
    targetSuccess: 50,
    steps: [
      'Récompense à côté de la jambe quand la laisse est souple.',
      'Stop immobile si tension, reprends quand détendu.',
      'Zigzag, demi-tours, variations de rythme.',
      'Généralise dehors, courte durée au début.'
    ],
    tips: 'Récompenses fréquentes au bon emplacement (près de ta jambe).'
  },
  {
    id: 'spin',
    title: 'Tourne',
    category: 'Tricks',
    level: 'Débutant',
    targetSuccess: 15,
    steps: [
      'Leurre en cercle proche du museau.',
      'Click/“Oui” à 3/4 du cercle.',
      'Éloigne peu à peu la main, ajoute le signal.',
      'Généralise les deux sens.'
    ],
    tips: 'Amusant, casse la monotonie des sessions.'
  }
];

export default DATA;
