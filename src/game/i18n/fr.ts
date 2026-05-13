import type en from "./en";

const fr: typeof en = {
  language: {
    code: "fr",
    name: "Francais",
  },
  title: "PILOTE DU TEMPS",
  hud: {
    gameOver: "Partie terminee",
    paused: "Pause",
    pressPauseToContinue: 'Appuyez sur "P" pour continuer',
    pressRestartToReset: 'Appuyez sur "R" pour recommencer',
    restarting: "Redemarrage",
  },
  keys: {
    down: "Bas",
    left: "Gauche",
    right: "Droite",
    space: "Espace",
    up: "Haut",
  },
  levels: {
    1: {
      introText: "AP J-C 1910",
      title: "L'aube du vol",
      description:
        "Des ciels clairs, des nuages lents et des biplans fragiles. Leurs plongees et formations rendent chaque duel personnel.",
    },
    2: {
      introText: "AP J-C 1940",
      title: "Guerre dans les nuages",
      description:
        "Les duels deviennent une guerre aerienne. Les chasseurs croisent votre route tandis que les bombardiers imposent le mouvement.",
    },
    3: {
      introText: "AP J-C 1970",
      title: "L'age du jet",
      description:
        "La technologie accelere. Appareils rapides, attaques nettes et ciel charge laissent peu de temps pour hesiter.",
    },
    4: {
      introText: "AP J-C 1982",
      title: "La guerre future",
      description:
        "Des machines avancees dominent un ciel mecanique. Attaques soudaines et mouvements etranges rendent tout combat instable.",
    },
    5: {
      introText: "AP J-C 2001",
      title: "Au-dela de demain",
      description:
        "Le combat devient alien. Les OVNI filent a une vitesse impossible dans un ciel ou les anciennes regles disparaissent.",
    },
  },
  menu: {
    alreadyAssignedTo: (binding: string) => `Deja assigne a ${binding}`,
    back: "Retour",
    continue: "Continuer",
    controlType: "Type de controle",
    current: "Selectionne",
    controls: "Commandes",
    debug: "Debug",
    directional: "Directionnel",
    effectsVolume: "Volume des effets",
    fire: "Tir",
    gameZoom: "Zoom jeu",
    levelShowcase: {
      basic: { label: "Ennemis", description: "Appareil principal de cette ere." },
      special: { label: "Special", description: "Menace rare aux attaques etranges." },
      boss: { label: "Boss", description: "Cible lourde avec degats visibles." },
      bonus: { label: "Bonus", description: "A collecter pour plus de points." },
      projectiles: {
        bomb: "Bombe",
        bullet: "Balle",
        energy: "Energie",
        rocket: "Roquette",
      },
    },
    invincibilityShield: "Bouclier d'invincibilite",
    language: "Langue",
    masterVolume: "Volume principal",
    musicVolume: "Volume musique",
    off: "Non",
    on: "Oui",
    options: "Options",
    pressAKey: "Appuyez sur une touche",
    remapControls: "Reconfigurer",
    rotate: "Rotation",
    selectLevel: "Choisir niveau",
    showControlsOverlay: "Afficher commandes",
    showCoordinates: "Afficher coordonnees",
    showHeadingVectors: "Afficher vecteurs",
    showHitBoxes: "Afficher collisions",
    showSteeringArc: "Afficher arc de virage",
    soon: "Bientot",
    start: "Demarrer",
    uiZoom: "Zoom UI",
  },
};

export default fr;
