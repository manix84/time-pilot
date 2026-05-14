import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { getFilterSettingsForMode } from "../game/filter-settings";
import { useTimePilot } from "../game/use-time-pilot";
import userOptions from "../game/user-options";

type TimePilotGameProps = {
  debug?: boolean;
};

function TimePilotGame({ debug }: TimePilotGameProps) {
  const [filterVersion, setFilterVersion] = useState(0);
  const rgbSplitFilterId = useId().replace(/:/g, "");
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
    "--filter-explosion-bloom-boost": activeFilterSettings.explosionBloomBoost,
    "--filter-time-warp-distortion": activeFilterSettings.timeWarpDistortionBoost,
    "--filter-rgb-split-url": `url(#${rgbSplitFilterId})`,
  } as CSSProperties;
  const rgbSplitOffset = Math.min(
    3,
    Math.max(0, Math.round(activeFilterSettings.colourBleed / 34))
  );

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
      data-rgb-split={activeFilterSettings.colourBleed > 0 ? "on" : "off"}
      data-filter-mode={userOptions.videoFilterMode}
      style={filterStyle}
    >
      <svg
        aria-hidden={"true"}
        className={"time-pilot-svg-filters"}
        focusable={"false"}
        height={0}
        width={0}
      >
        <filter id={rgbSplitFilterId}>
          <feOffset
            dx={rgbSplitOffset}
            dy={rgbSplitOffset}
            in={"SourceGraphic"}
            result={"layer-one"}
          />
          <feComponentTransfer in={"layer-one"} result={"red"}>
            <feFuncR type={"identity"} />
            <feFuncG tableValues={"0"} type={"discrete"} />
            <feFuncB tableValues={"0"} type={"discrete"} />
          </feComponentTransfer>

          <feOffset
            dx={-rgbSplitOffset}
            dy={-rgbSplitOffset}
            in={"SourceGraphic"}
            result={"layer-two"}
          />
          <feComponentTransfer in={"layer-two"} result={"cyan"}>
            <feFuncR tableValues={"0"} type={"discrete"} />
            <feFuncG type={"identity"} />
            <feFuncB type={"identity"} />
          </feComponentTransfer>

          <feBlend in={"red"} in2={"cyan"} mode={"screen"} result={"color-split"} />
        </filter>
      </svg>
      <div ref={setContainerElement} className={"time-pilot-stage"}>
        <span className={"time-pilot-filter-bloom"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-dither"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-burn-in"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-interference"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-tracking"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-reflection"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-distortion"} aria-hidden={"true"} />
        <span className={"time-pilot-filter-flicker"} aria-hidden={"true"} />
      </div>
    </div>
  );
}

export default TimePilotGame;
