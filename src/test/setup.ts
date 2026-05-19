import { vi } from "vitest";

type CanvasCall = {
  method: string;
  args: unknown[];
};

function createStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
  };
}

export function createCanvasContextMock() {
  const calls: CanvasCall[] = [];

  return {
    calls,
    fillStyle: "",
    font: "",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "top" as CanvasTextBaseline,
    lineWidth: 1,
    lineJoin: "miter" as CanvasLineJoin,
    miterLimit: 10,
    strokeStyle: "",
    globalAlpha: 1,
    save: vi.fn((...args: unknown[]) => calls.push({ method: "save", args })),
    restore: vi.fn((...args: unknown[]) => calls.push({ method: "restore", args })),
    translate: vi.fn((...args: unknown[]) => calls.push({ method: "translate", args })),
    transform: vi.fn((...args: unknown[]) => calls.push({ method: "transform", args })),
    scale: vi.fn((...args: unknown[]) => calls.push({ method: "scale", args })),
    fillText: vi.fn((...args: unknown[]) => calls.push({ method: "fillText", args })),
    strokeText: vi.fn((...args: unknown[]) => calls.push({ method: "strokeText", args })),
    drawImage: vi.fn((...args: unknown[]) => calls.push({ method: "drawImage", args })),
    beginPath: vi.fn((...args: unknown[]) => calls.push({ method: "beginPath", args })),
    closePath: vi.fn((...args: unknown[]) => calls.push({ method: "closePath", args })),
    rect: vi.fn((...args: unknown[]) => calls.push({ method: "rect", args })),
    clip: vi.fn((...args: unknown[]) => calls.push({ method: "clip", args })),
    arc: vi.fn((...args: unknown[]) => calls.push({ method: "arc", args })),
    fill: vi.fn((...args: unknown[]) => calls.push({ method: "fill", args })),
    stroke: vi.fn((...args: unknown[]) => calls.push({ method: "stroke", args })),
    strokeRect: vi.fn((...args: unknown[]) => calls.push({ method: "strokeRect", args })),
    fillRect: vi.fn((...args: unknown[]) => calls.push({ method: "fillRect", args })),
    measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
    moveTo: vi.fn((...args: unknown[]) => calls.push({ method: "moveTo", args })),
    lineTo: vi.fn((...args: unknown[]) => calls.push({ method: "lineTo", args })),
    roundRect: vi.fn((...args: unknown[]) => calls.push({ method: "roundRect", args })),
  };
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: vi.fn(() => createCanvasContextMock()),
});

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: createStorageMock(),
});

Object.defineProperty(HTMLCanvasElement.prototype, "moveTo", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, "lineTo", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, "stroke", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, "load", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window, "requestAnimationFrame", {
  configurable: true,
  value: vi.fn((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(Date.now()), 0)
  ),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  configurable: true,
  value: vi.fn((id: number) => window.clearTimeout(id)),
});

Object.defineProperty(navigator, "getGamepads", {
  configurable: true,
  value: vi.fn(() => []),
});
