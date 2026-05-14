export type FilterMode =
  | "off"
  | "arcade-crt"
  | "home-tv-crt"
  | "portable-crt"
  | "vhs"
  | "custom";

export type FilterSettingKey =
  | "scanlines"
  | "crtMask"
  | "curvature"
  | "bloom"
  | "horizontalBlur"
  | "colourBleed"
  | "ditherBlending"
  | "flicker"
  | "interference"
  | "vhsTracking"
  | "burnIn"
  | "glassReflection"
  | "blackCrush"
  | "explosionBloomBoost"
  | "timeWarpDistortionBoost";

export type FilterSettings = Record<FilterSettingKey, number>;

export type FilterRuntimeBoosts = {
  explosionBloomBoost: number;
  timeWarpDistortionBoost: number;
  bulletPersistenceBoost: number;
  lowHealthInstabilityBoost: number;
};

export const defaultFilterMode: FilterMode = "off";

export const filterSettingKeys: FilterSettingKey[] = [
  "scanlines",
  "crtMask",
  "curvature",
  "bloom",
  "horizontalBlur",
  "colourBleed",
  "ditherBlending",
  "flicker",
  "interference",
  "vhsTracking",
  "burnIn",
  "glassReflection",
  "blackCrush",
  "explosionBloomBoost",
  "timeWarpDistortionBoost",
];

export const filterModes: FilterMode[] = [
  "off",
  "arcade-crt",
  "home-tv-crt",
  "portable-crt",
  "vhs",
  "custom",
];

export const filterModeLabels: Record<FilterMode, string> = {
  off: "Off",
  "arcade-crt": "Arcade CRT",
  "home-tv-crt": "Home TV CRT",
  "portable-crt": "Portable CRT",
  vhs: "VHS Mode",
  custom: "Custom",
};

export const filterSettingLabels: Record<FilterSettingKey, string> = {
  scanlines: "Scanlines",
  crtMask: "Aperture Grille",
  curvature: "Curvature",
  bloom: "Phosphor Glow",
  horizontalBlur: "Horizontal Blur",
  colourBleed: "RGB Split",
  ditherBlending: "Dither Blending",
  flicker: "Flicker",
  interference: "Interference Bands",
  vhsTracking: "VHS Tracking",
  burnIn: "Burn-In",
  glassReflection: "Cabinet Glass Reflection",
  blackCrush: "Black Crush",
  explosionBloomBoost: "Explosion Bloom Boost",
  timeWarpDistortionBoost: "Time Warp Distortion",
};

export const filterSettingDescriptions: Record<FilterSettingKey, string> = {
  scanlines: "Dark horizontal lines between rows of pixels, like a low-resolution CRT.",
  crtMask: "A coloured aperture grille pattern that breaks the image into red, green, and blue phosphor stripes.",
  curvature: "Rounds the screen corners and adds a tube-like edge shape.",
  bloom: "Soft glow around bright pixels, similar to phosphors lighting up on glass.",
  horizontalBlur: "Smears pixels slightly left and right, reducing the hard digital edge.",
  colourBleed: "Separates red and blue channels to create a visible RGB split at high values.",
  ditherBlending: "Adds a fine checker blend that softens hard dither patterns and colour steps.",
  flicker: "Adds subtle frame brightness instability. Keep low if flicker causes discomfort.",
  interference: "Adds faint horizontal interference bands and signal noise.",
  vhsTracking: "Moves interference vertically to mimic VHS tracking drift.",
  burnIn: "Adds a warm ghosted centre and darker edges, like aged phosphor wear.",
  glassReflection: "Adds a diagonal highlight as if the picture is behind cabinet glass.",
  blackCrush: "Deepens dark tones and increases contrast in shadow areas.",
  explosionBloomBoost: "Extra glow layered on top of phosphor glow for burst-heavy moments.",
  timeWarpDistortionBoost: "Extra curvature and interference intended for time-warp style distortion.",
};

export const filterPresets: Record<Exclude<FilterMode, "custom">, FilterSettings> = {
  off: {
    scanlines: 0,
    crtMask: 0,
    curvature: 0,
    bloom: 0,
    horizontalBlur: 0,
    colourBleed: 0,
    ditherBlending: 0,
    flicker: 0,
    interference: 0,
    vhsTracking: 0,
    burnIn: 0,
    glassReflection: 0,
    blackCrush: 0,
    explosionBloomBoost: 0,
    timeWarpDistortionBoost: 0,
  },
  "arcade-crt": {
    scanlines: 35,
    crtMask: 25,
    curvature: 12,
    bloom: 28,
    horizontalBlur: 18,
    colourBleed: 10,
    ditherBlending: 35,
    flicker: 5,
    interference: 0,
    vhsTracking: 0,
    burnIn: 0,
    glassReflection: 0,
    blackCrush: 10,
    explosionBloomBoost: 0,
    timeWarpDistortionBoost: 0,
  },
  "home-tv-crt": {
    scanlines: 25,
    crtMask: 12,
    curvature: 16,
    bloom: 24,
    horizontalBlur: 28,
    colourBleed: 30,
    ditherBlending: 45,
    flicker: 7,
    interference: 8,
    vhsTracking: 0,
    burnIn: 0,
    glassReflection: 0,
    blackCrush: 12,
    explosionBloomBoost: 0,
    timeWarpDistortionBoost: 0,
  },
  "portable-crt": {
    scanlines: 45,
    crtMask: 18,
    curvature: 22,
    bloom: 18,
    horizontalBlur: 22,
    colourBleed: 18,
    ditherBlending: 25,
    flicker: 10,
    interference: 12,
    vhsTracking: 0,
    burnIn: 0,
    glassReflection: 0,
    blackCrush: 18,
    explosionBloomBoost: 0,
    timeWarpDistortionBoost: 0,
  },
  vhs: {
    scanlines: 18,
    crtMask: 0,
    curvature: 8,
    bloom: 20,
    horizontalBlur: 35,
    colourBleed: 45,
    ditherBlending: 25,
    flicker: 14,
    interference: 35,
    vhsTracking: 40,
    burnIn: 0,
    glassReflection: 0,
    blackCrush: 15,
    explosionBloomBoost: 0,
    timeWarpDistortionBoost: 0,
  },
};

export const defaultCustomFilterSettings: FilterSettings = {
  ...filterPresets[defaultFilterMode],
};

export const defaultRuntimeBoosts: FilterRuntimeBoosts = {
  explosionBloomBoost: 0,
  timeWarpDistortionBoost: 0,
  bulletPersistenceBoost: 0,
  lowHealthInstabilityBoost: 0,
};

export const normalizeFilterIntensity = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

export const normalizeFilterSettings = (value: unknown): FilterSettings => {
  const normalized = { ...defaultCustomFilterSettings };

  if (!value || typeof value !== "object") {
    return normalized;
  }

  for (const key of filterSettingKeys) {
    normalized[key] = normalizeFilterIntensity(
      (value as Partial<Record<FilterSettingKey, unknown>>)[key]
    );
  }

  return normalized;
};

export const getFilterSettingsForMode = (
  mode: FilterMode,
  customSettings: FilterSettings,
  boosts: Partial<FilterRuntimeBoosts> = {}
): FilterSettings => {
  const baseSettings =
    mode === "custom" ? customSettings : filterPresets[mode] ?? filterPresets.off;

  return {
    ...baseSettings,
    bloom: normalizeFilterIntensity(
      baseSettings.bloom +
        baseSettings.explosionBloomBoost +
        (boosts.explosionBloomBoost ?? 0)
    ),
    curvature: normalizeFilterIntensity(
      baseSettings.curvature +
        baseSettings.timeWarpDistortionBoost +
        (boosts.timeWarpDistortionBoost ?? 0)
    ),
    ditherBlending: normalizeFilterIntensity(
      baseSettings.ditherBlending + (boosts.bulletPersistenceBoost ?? 0)
    ),
    flicker: normalizeFilterIntensity(
      baseSettings.flicker + (boosts.lowHealthInstabilityBoost ?? 0)
    ),
    interference: normalizeFilterIntensity(
      baseSettings.interference +
        (boosts.timeWarpDistortionBoost ?? 0) +
        (boosts.lowHealthInstabilityBoost ?? 0)
    ),
  };
};
