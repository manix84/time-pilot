import type en from "./en";

const it: typeof en = {
  language: {
    code: "it",
    name: "Italiano",
  },
  title: "PILOTA DEL TEMPO",
  hud: {
    credits: "Crediti",
    gameOver: "Fine partita",
    paused: "Pausa",
    pressPauseToContinue: 'Premi "P" per continuare',
    pressRestartToReset: 'Premi "R" per riavviare',
    restarting: "Riavvio",
  },
  keys: {
    down: "Giu",
    left: "Sinistra",
    right: "Destra",
    space: "Spazio",
    up: "Su",
  },
  levels: {
    1: {
      introText: "D.C. 1910",
      title: "L'alba del volo",
      description:
        "Cieli luminosi, nuvole lente e fragili biplani. Picchiate e formazioni rendono ogni duello personale.",
    },
    2: {
      introText: "D.C. 1940",
      title: "Guerra tra le nuvole",
      description:
        "I duelli diventano guerra aerea. I caccia tagliano la rotta mentre i bombardieri costringono a muoversi.",
    },
    3: {
      introText: "D.C. 1970",
      title: "L'era dei jet",
      description:
        "La tecnologia accelera. Velivoli rapidi, attacchi precisi e cieli affollati lasciano poco tempo per esitare.",
    },
    4: {
      introText: "D.C. 1982",
      title: "La guerra futura",
      description:
        "Macchine avanzate dominano cieli meccanici. Attacchi improvvisi e movimenti strani rendono ogni scontro imprevedibile.",
    },
    5: {
      introText: "D.C. 2001",
      title: "Oltre il domani",
      description:
        "La battaglia diventa aliena. Gli UFO sfrecciano con velocita impossibile in cieli dove le vecchie regole spariscono.",
    },
  },
  menu: {
    achievements: "Achievements",
    alreadyAssignedTo: (binding: string) => `Gia assegnato a ${binding}`,
    back: "Indietro",
    cancel: "Annulla",
    continues: "Continue",
    continue: "Continua",
    controlType: "Tipo controlli",
    current: "Selezionato",
    controls: "Controlli",
    customCrtOptions: "Custom CRT Options",
    debug: "Debug",
    demo: "Demo",
    directional: "Direzionale",
    effectsVolume: "Volume effetti",
    exit: "Esci",
    fire: "Fuoco",
    filters: "Filters",
    fullScreen: "Schermo intero",
    gameOver: "Fine partita",
    gameZoom: "Zoom gioco",
    levelShowcase: {
      basic: {
        label: "Nemici",
        description: "Minaccia principale dell'era.",
      },
      special: {
        label: "Speciale",
        description: "Minaccia rara con attacchi insoliti.",
      },
      boss: {
        label: "Boss",
        description: "Bersaglio pesante con danni visibili.",
      },
      bonus: {
        label: "Bonus",
        description: "Raccoglilo per piu punti.",
      },
      projectiles: {
        bomb: "Bomba",
        bullet: "Proiettile",
        plasma: "Plasma",
        rocket: "Razzo",
      },
    },
    invincibilityShield: "Scudo invincibile",
    language: "Lingua",
    lives: "Vite",
    masterVolume: "Volume principale",
    musicVolume: "Volume musica",
    off: "No",
    on: "Si",
    options: "Opzioni",
    playPreroll: "Riproduci preroll",
    pressAKey: "Premi un tasto",
    remapControls: "Rimappa controlli",
    confirmReset: "Conferma reset",
    resetAchievements: "Reset achievements",
    resetAllStoredData: "Reset tutti i dati",
    resetConfirmTitle: "Confermare reset?",
    resetData: "Reset dati",
    resetWarning: (scope: string) =>
      `Attenzione: resettera ${scope}. Non si puo annullare.`,
    resetWarningAchievements: "achievements",
    resetWarningAllStoredData: "tutti i dati Time Pilot salvati",
    resetWarningPreferences: "preferenze",
    resetWarningScores: "punteggi",
    restart: "Riavvia",
    restartConfirmTitle: "Riavviare partita?",
    resetFilters: "Reset Filters",
    resetPreferences: "Reset preferenze",
    resetScores: "Reset punteggi",
    rotate: "Rotazione",
    selectLevel: "Seleziona livello",
    showControlsOverlay: "Mostra controlli",
    showCoordinates: "Mostra coordinate",
    showHeadingVectors: "Mostra vettori",
    showHitBoxes: "Mostra hitbox",
    showSteeringArc: "Mostra arco sterzo",
    soon: "Presto",
    start: "Inizia",
    uiZoom: "Zoom UI",
    update: "Aggiorna",
    videoFilterMode: "Video Filter Mode",
    watchDemo: "Guarda demo",
  },
};

export default it;
