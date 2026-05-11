import { useMemo, useState } from "react";
import type { ControllerType } from "../game/types";
import { useTimePilot } from "../game/use-time-pilot";

type TimePilotGameProps = {
  debug?: boolean;
};

const keyboardOptions: Array<{ label: string; value: ControllerType }> = [
  { label: "Directional", value: "keyboard1" },
  { label: "Rotate", value: "keyboard2" },
];

function TimePilotGame({ debug = false }: TimePilotGameProps) {
  const [controllerType, setControllerType] =
    useState<ControllerType>("keyboard1");
  const [gamepadEnabled, setGamepadEnabled] = useState(true);
  const options = useMemo(
    () => ({ controllerType, debug, gamepadEnabled }),
    [controllerType, debug, gamepadEnabled]
  );
  const { setContainerElement } = useTimePilot(options);

  return (
    <div className={"time-pilot-game"}>
      <div className={"time-pilot-controls"} aria-label={"Controller settings"}>
        <fieldset className={"control-group"}>
          <legend>Keyboard</legend>
          <div className={"segmented-control"}>
            {keyboardOptions.map((option) => (
              <label key={option.value}>
                <input
                  checked={controllerType === option.value}
                  name={"controllerType"}
                  onChange={() => setControllerType(option.value)}
                  type={"radio"}
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={"gamepad-toggle"}>
          <input
            checked={gamepadEnabled}
            onChange={(event) => setGamepadEnabled(event.currentTarget.checked)}
            type={"checkbox"}
          />
          <span>Gamepad</span>
        </label>
      </div>

      <div ref={setContainerElement} className={"time-pilot-stage"} />
    </div>
  );
}

export default TimePilotGame;
