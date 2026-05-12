import { useMemo } from "react";
import { useTimePilot } from "../game/use-time-pilot";

type TimePilotGameProps = {
  debug?: boolean;
};

function TimePilotGame({ debug }: TimePilotGameProps) {
  const options = useMemo(
    () => ({ debug }),
    [debug]
  );
  const { setContainerElement } = useTimePilot(options);

  return (
    <div className={"time-pilot-game"}>
      <div ref={setContainerElement} className={"time-pilot-stage"} />
    </div>
  );
}

export default TimePilotGame;
