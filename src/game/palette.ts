const palette = {
  aircraft: {
    bullet: "#FFF",
    enemyBullet: "#FF9",
    playerShield: "#F00",
  },
  debug: {
    bonusHitbox: "#0FF",
    enemyHitbox: "#F00",
    playerHitbox: "#0F0",
  },
  level: {
    sky1910: "#4FC3F7",
    sky1940: "#5BA892",
    sky1970: "#D8A531",
    sky1982: "#C75B2A",
    sky2001: "#2A1B4A",
  },
  menu: {
    backplate: "rgba(4, 10, 18, 0.82)",
    disabledBackground: "#152033",
    disabledBorder: "#334158",
    disabledText: "#718099",
    itemBackground: "#0B1727",
    itemBorder: "#466485",
    itemText: "#E9F3FF",
    mutedText: "#C7D5EB",
    progressFill: "#F2B84B",
    selectedBackground: "#F2B84B",
    selectedBorder: "#FFF1B8",
    selectedText: "#111927",
    waitingBorder: "#7EDBD3",
    waitingText: "#7EDBD3",
  },
  overlay: {
    activeFill: "#FFD400",
    activeWash: "rgba(255, 212, 0, 0.22)",
    activeWashStrong: "rgba(255, 212, 0, 0.24)",
    line: "#C7D5EB",
  },
  text: {
    white: "#FFF",
  },
  title: {
    face: "#FFD400",
    shadowDeep: "#3F0700",
    shadowDark: "#7A1200",
    shadowMid: "#A72A00",
    shadowOrange: "#C94F00",
    shadowLight: "#FF8C00",
    shadowGold: "#FFAA00",
  },
} as const;

export default palette;
