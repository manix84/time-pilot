import { useCallback, useEffect, useRef } from "react";
import TimePilot, { type TimePilotOptions } from "./index";

/**
 * Controls returned by {@link useTimePilot}.
 */
export interface UseTimePilotResult {
  /**
   * Ref callback used to attach the game to a React-managed container.
   */
  setContainerElement: (node: HTMLDivElement | null) => void;
  /**
   * Starts the game if it is not already mounted.
   */
  start: () => void;
  /**
   * Pauses the running game.
   */
  pause: () => void;
  /**
   * Resumes the game after an explicit pause.
   */
  resume: () => void;
  /**
   * Restarts the current game instance.
   */
  restart: () => void;
  /**
   * Destroys the game instance and clears the container.
   */
  destroy: () => void;
}

/**
 * React hook that owns a TimePilot engine instance.
 *
 * @param options - Engine options passed to the TimePilot constructor.
 * @returns Container ref callback and imperative game controls.
 */
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
