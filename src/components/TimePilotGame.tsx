import { useEffect, useRef } from "react";
import TimePilot from "../game/index";

type TimePilotGameProps = {
  debug?: boolean;
};

type TimePilotInstance = {
  destroyGame?: () => void;
};

type TimePilotConstructor = new (
  element: HTMLDivElement,
  options: { debug: boolean }
) => TimePilotInstance;

function TimePilotGame({ debug = false }: TimePilotGameProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const GameClass = TimePilot as unknown as TimePilotConstructor;
    const instance = new GameClass(host, { debug });

    return () => {
      if (typeof instance?.destroyGame === "function") {
        instance.destroyGame();
      }
      host.innerHTML = "";
    };
  }, [debug]);

  return <div ref={hostRef} className={"time-pilot-stage"} />;
}

export default TimePilotGame;
