import type en from "./en";

const de: typeof en = {
  language: {
    code: "de",
    name: "Deutsch",
  },
  title: "ZEITPILOT",
  hud: {
    gameOver: "Spiel vorbei",
    paused: "Pausiert",
    pressPauseToContinue: 'Druecke "P" zum Fortsetzen',
    pressRestartToReset: 'Druecke "R" zum Neustart',
    restarting: "Neustart",
  },
  keys: {
    down: "Runter",
    left: "Links",
    right: "Rechts",
    space: "Leertaste",
    up: "Hoch",
  },
  levels: {
    1: {
      introText: "N. CHR. 1910",
      title: "Die Daemmerung des Flugs",
      description:
        "Helle Himmel, treibende Wolken und zerbrechliche Doppeldecker. Ihre Sturzfluege und Formationen machen jedes Duell persoenlich.",
    },
    2: {
      introText: "N. CHR. 1940",
      title: "Krieg in den Wolken",
      description:
        "Aus Luftduellen wird Krieg. Jaeger schneiden deinen Kurs, waehrend schwere Bomber dich staendig in Bewegung zwingen.",
    },
    3: {
      introText: "N. CHR. 1970",
      title: "Das Jet-Zeitalter",
      description:
        "Die Technik rast voran. Schnelle Maschinen, scharfe Angriffe und voller Luftraum lassen kaum Zeit zum Zoegern.",
    },
    4: {
      introText: "N. CHR. 1982",
      title: "Der Zukunftskrieg",
      description:
        "Fortschrittliche Maschinen beherrschen mechanische Himmel. Ploetzliche Angriffe und seltsame Bewegungen machen alles unberechenbar.",
    },
    5: {
      introText: "N. CHR. 2001",
      title: "Jenseits von Morgen",
      description:
        "Der Kampf wird fremdartig. UFOs gleiten mit unmoeglicher Geschwindigkeit durch Himmel, in denen alte Regeln nicht mehr gelten.",
    },
  },
  menu: {
    alreadyAssignedTo: (binding: string) => `Bereits ${binding} zugewiesen`,
    back: "Zurueck",
    continue: "Weiter",
    controlType: "Steuerung",
    current: "Ausgewaehlt",
    controls: "Tasten",
    debug: "Debug",
    directional: "Richtung",
    effectsVolume: "Effektlautstaerke",
    fire: "Feuer",
    fullScreen: "Vollbild",
    gameZoom: "Spiel-Zoom",
    levelShowcase: {
      basic: {
        label: "Feinde",
        description: "Hauptgegner dieser Epoche.",
      },
      special: {
        label: "Spezial",
        description: "Seltene Bedrohung mit Sonderangriffen.",
      },
      boss: {
        label: "Boss",
        description: "Schweres Ziel mit Schadensphasen.",
      },
      bonus: {
        label: "Bonus",
        description: "Sammeln fuer steigende Punkte.",
      },
      projectiles: {
        bomb: "Bombe",
        bullet: "Kugel",
        plasma: "Plasma",
        rocket: "Rakete",
      },
    },
    invincibilityShield: "Unverwundbarkeit",
    language: "Sprache",
    masterVolume: "Gesamtlautstaerke",
    musicVolume: "Musiklautstaerke",
    off: "Aus",
    on: "Ein",
    options: "Optionen",
    pressAKey: "Taste druecken",
    remapControls: "Tasten belegen",
    rotate: "Drehen",
    selectLevel: "Level waehlen",
    showControlsOverlay: "Steuerung anzeigen",
    showCoordinates: "Koordinaten anzeigen",
    showHeadingVectors: "Vektoren anzeigen",
    showHitBoxes: "Hitboxen anzeigen",
    showSteeringArc: "Lenkbogen anzeigen",
    soon: "Bald",
    start: "Start",
    uiZoom: "UI-Zoom",
  },
};

export default de;
