import { useEffect, useRef } from "react";

type CanvasDemoProps = {
  draw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  height?: number;
  width?: number;
};

export const CanvasDemo = ({ draw, height = 360, width = 560 }: CanvasDemoProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    draw(context, canvas);
  }, [draw]);

  return (
    <canvas
      className={"storybook-canvas"}
      height={height}
      ref={canvasRef}
      width={width}
    />
  );
};
