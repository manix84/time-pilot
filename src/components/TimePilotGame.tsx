import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getFilterSettingsForMode } from "../game/filter-settings";
import { useTimePilot } from "../game/use-time-pilot";
import userOptions from "../game/user-options";

type TimePilotGameProps = {
  debug?: boolean;
};

function TimePilotGame({ debug }: TimePilotGameProps) {
  const [filterVersion, setFilterVersion] = useState(0);
  const options = useMemo(
    () => ({ debug }),
    [debug]
  );
  const { setContainerElement } = useTimePilot(options);
  const activeFilterSettings = getFilterSettingsForMode(
    userOptions.videoFilterMode,
    userOptions.filterSettings
  );
  const filterStyle = {
    "--filter-scanlines": activeFilterSettings.scanlines,
    "--filter-crt-mask": activeFilterSettings.crtMask,
    "--filter-curvature": activeFilterSettings.curvature,
    "--filter-bloom": activeFilterSettings.bloom,
    "--filter-horizontal-blur": activeFilterSettings.horizontalBlur,
    "--filter-colour-bleed": activeFilterSettings.colourBleed,
    "--filter-dither-blending": activeFilterSettings.ditherBlending,
    "--filter-flicker": activeFilterSettings.flicker,
    "--filter-interference": activeFilterSettings.interference,
    "--filter-vhs-tracking": activeFilterSettings.vhsTracking,
    "--filter-burn-in": activeFilterSettings.burnIn,
    "--filter-glass-reflection": activeFilterSettings.glassReflection,
    "--filter-black-crush": activeFilterSettings.blackCrush,
  } as CSSProperties;

  void filterVersion;

  useEffect(() => {
    const handleOptionsChanged = (): void => {
      setFilterVersion((version) => version + 1);
    };

    window.addEventListener("timePilot:userOptionsChanged", handleOptionsChanged);

    return () => {
      window.removeEventListener("timePilot:userOptionsChanged", handleOptionsChanged);
    };
  }, []);

  return (
    <div
      className={"time-pilot-game"}
      data-filter-mode={userOptions.videoFilterMode}
      style={filterStyle}
    >
      <div ref={setContainerElement} className={"time-pilot-stage"}>
        <span className={"time-pilot-filter-colour-bleed"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-dither"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-burn-in"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-flicker"} aria-hidden={"true"} />
      </div>
    </div>
  );
}

export default TimePilotGame;
