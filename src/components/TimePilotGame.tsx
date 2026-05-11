import { useMemo } from "react";
import { useTimePilot } from "../game/use-time-pilot";

type TimePilotGameProps = {
  debug?: boolean;
};

function TimePilotGame({ debug = false }: TimePilotGameProps) {
  const options = useMemo(() => ({ debug }), [debug]);
  const { setContainerElement } = useTimePilot(options);

  return <div ref={setContainerElement} className={"time-pilot-stage"} />;
}

export default TimePilotGame;
