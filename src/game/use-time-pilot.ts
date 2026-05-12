import { useCallback, useEffect, useRef } from "react";
import TimePilot, { type TimePilotOptions } from "./index";

export interface UseTimePilotResult {
  setContainerElement: (node: HTMLDivElement | null) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void;
}

export const useTimePilot = (options: TimePilotOptions = {}): UseTimePilotResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<TimePilot | null>(null);

  const setContainerElement = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  const destroy = useCallback(() => {
    gameRef.current?.destroyGame();
    gameRef.current = null;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  const start = useCallback(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) {
      return;
    }

    gameRef.current = new TimePilot(container, options);
  }, [options]);

  const pause = useCallback(() => {
    gameRef.current?.pauseGame(true);
  }, []);

  const resume = useCallback(() => {
    gameRef.current?.resumeGame();
  }, []);

  const restart = useCallback(() => {
    gameRef.current?.restartGame();
  }, []);

  useEffect(() => {
    start();
    return destroy;
  }, [destroy, start]);

  return {
    setContainerElement,
    start,
    pause,
    resume,
    restart,
    destroy,
  };
};
