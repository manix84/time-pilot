export const drawLabel = (context: CanvasRenderingContext2D, label: string, x: number, y: number, color = "#C7D5EB"): void => {
  context.fillStyle = color;
  context.font = "14px Trebuchet MS, Segoe UI, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(label, x, y);
};
