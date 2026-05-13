import type en from "./en";

const es: typeof en = {
  language: {
    code: "es",
    name: "Espanol",
  },
  title: "PILOTO DEL TIEMPO",
  hud: {
    gameOver: "Fin de la partida",
    paused: "Pausa",
    pressPauseToContinue: 'Pulsa "P" para continuar',
    pressRestartToReset: 'Pulsa "R" para reiniciar',
    restarting: "Reiniciando",
  },
  keys: {
    down: "Abajo",
    left: "Izquierda",
    right: "Derecha",
    space: "Espacio",
    up: "Arriba",
  },
  levels: {
    1: {
      introText: "D.C. 1910",
      title: "El amanecer del vuelo",
      description:
        "Cielos abiertos, nubes lentas y biplanos fragiles. Parecen simples, pero sus picados y formaciones hacen personal cada combate.",
    },
    2: {
      introText: "D.C. 1940",
      title: "Guerra en las nubes",
      description:
        "Los duelos aereos se vuelven guerra total. Los cazas cruzan tu ruta con precision mientras los bombarderos te obligan a moverte.",
    },
    3: {
      introText: "D.C. 1970",
      title: "La era del jet",
      description:
        "La tecnologia acelera. Aeronaves rapidas, ataques mas duros y cielos llenos dejan poco tiempo para dudar.",
    },
    4: {
      introText: "D.C. 1982",
      title: "La guerra futura",
      description:
        "Maquinas avanzadas dominan cielos mecanicos. Ataques repentinos y movimientos extranos hacen cada encuentro imprevisible.",
    },
    5: {
      introText: "D.C. 2001",
      title: "Mas alla del manana",
      description:
        "La batalla se vuelve alienigena. Los OVNI se mueven a velocidad imposible por cielos donde las viejas reglas ya no sirven.",
    },
  },
  menu: {
    alreadyAssignedTo: (binding: string) => `Ya asignado a ${binding}`,
    back: "Volver",
    continue: "Continuar",
    controlType: "Tipo de control",
    current: "Seleccionado",
    controls: "Controles",
    debug: "Debug",
    directional: "Direccional",
    effectsVolume: "Volumen de efectos",
    fire: "Disparo",
    gameZoom: "Zoom del juego",
    levelShowcase: {
      basic: {
        label: "Enemigos",
        description: "Nave atacante principal de esta era.",
      },
      special: {
        label: "Especial",
        description: "Amenaza rara con ataques inusuales.",
      },
      boss: {
        label: "Jefe",
        description: "Objetivo pesado con fases de dano.",
      },
      bonus: {
        label: "Bonus",
        description: "Recogelo para ganar mas puntos.",
      },
    },
    invincibilityShield: "Escudo de invencibilidad",
    language: "Idioma",
    masterVolume: "Volumen principal",
    musicVolume: "Volumen musica",
    off: "No",
    on: "Si",
    options: "Opciones",
    pressAKey: "Pulsa una tecla",
    remapControls: "Reasignar controles",
    rotate: "Rotacion",
    selectLevel: "Elegir nivel",
    showControlsOverlay: "Mostrar controles",
    showCoordinates: "Mostrar coordenadas",
    showHeadingVectors: "Mostrar vectores",
    showHitBoxes: "Mostrar colisiones",
    showSteeringArc: "Mostrar arco de giro",
    soon: "Pronto",
    start: "Empezar",
    uiZoom: "Zoom UI",
  },
};

export default es;
