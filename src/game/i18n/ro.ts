import type en from "./en";

const ro: typeof en = {
  language: {
    code: "ro",
    name: "Romana",
  },
  title: "PILOTUL TIMPULUI",
  hud: {
    credits: "Credite",
    gameOver: "Joc terminat",
    paused: "Pauza",
    pressPauseToContinue: 'Apasa "P" pentru continuare',
    pressRestartToReset: 'Apasa "R" pentru restart',
    restarting: "Repornire",
  },
  keys: {
    down: "Jos",
    left: "Stanga",
    right: "Dreapta",
    space: "Spatiu",
    up: "Sus",
  },
  levels: {
    1: {
      introText: "D.HR. 1910",
      title: "Zorii zborului",
      description:
        "Ceruri luminoase, nori plutitori si biplane fragile. Plonjarile si formatiile lor fac fiecare duel personal.",
    },
    2: {
      introText: "D.HR. 1940",
      title: "Razboi in nori",
      description:
        "Duelurile devin razboi aerian. Vanatorii iti taie drumul, iar bombardierele grele te obliga sa te misti.",
    },
    3: {
      introText: "D.HR. 1970",
      title: "Era avioanelor jet",
      description:
        "Tehnologia accelereaza. Aparatele rapide, atacurile dure si cerurile aglomerate lasa putin timp de ezitare.",
    },
    4: {
      introText: "D.HR. 1982",
      title: "Razboiul viitorului",
      description:
        "Masini avansate domina ceruri mecanice. Atacurile bruste si miscarile ciudate fac fiecare lupta imprevizibila.",
    },
    5: {
      introText: "D.HR. 2001",
      title: "Dincolo de maine",
      description:
        "Lupta devine extraterestra. OZN-urile aluneca incredibil de repede prin ceruri unde vechile reguli dispar.",
    },
  },
  menu: {
    alreadyAssignedTo: (binding: string) => `Deja atribuit la ${binding}`,
    back: "Inapoi",
    cancel: "Anuleaza",
    continues: "Continuari",
    continue: "Continua",
    controlType: "Tip control",
    current: "Selectat",
    controls: "Controale",
    customCrtOptions: "Custom CRT Options",
    debug: "Debug",
    demo: "Demo",
    directional: "Directional",
    effectsVolume: "Volum efecte",
    exit: "Iesire",
    fire: "Foc",
    filters: "Filters",
    fullScreen: "Ecran complet",
    gameOver: "Joc terminat",
    gameZoom: "Zoom joc",
    levelShowcase: {
      basic: {
        label: "Inamici",
        description: "Aeronava principala a erei.",
      },
      special: {
        label: "Special",
        description: "Amenintare rara cu atacuri neobisnuite.",
      },
      boss: {
        label: "Boss",
        description: "Tinta grea cu stari de avarie.",
      },
      bonus: {
        label: "Bonus",
        description: "Colecteaza pentru scor crescut.",
      },
      projectiles: {
        bomb: "Bomba",
        bullet: "Glont",
        plasma: "Plasma",
        rocket: "Racheta",
      },
    },
    invincibilityShield: "Scut invincibil",
    language: "Limba",
    lives: "Vieti",
    masterVolume: "Volum principal",
    musicVolume: "Volum muzica",
    off: "Oprit",
    on: "Pornit",
    options: "Optiuni",
    pressAKey: "Apasa o tasta",
    remapControls: "Reconfigureaza",
    restart: "Restart",
    restartConfirmTitle: "Reincepi jocul?",
    resetFilters: "Reset Filters",
    rotate: "Rotire",
    selectLevel: "Alege nivelul",
    showControlsOverlay: "Arata controale",
    showCoordinates: "Arata coordonate",
    showHeadingVectors: "Arata vectori",
    showHitBoxes: "Arata hitbox-uri",
    showSteeringArc: "Arata arc viraj",
    soon: "In curand",
    start: "Start",
    uiZoom: "Zoom UI",
    update: "Actualizeaza",
    videoFilterMode: "Video Filter Mode",
    watchDemo: "Vezi demo",
  },
};

export default ro;
