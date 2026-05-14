import { afterEach, describe, expect, it, vi } from "vitest";
import helpers from "../helpers";

describe("engine/helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rounds long floating point values to five decimal places", () => {
    expect(helpers.float(1.23456789)).toBe(1.23457);
  });

  it("rotates toward a destination heading by the provided step", () => {
    expect(helpers.rotateTo(90, 0, 22.5)).toBe(22.5);
    expect(helpers.rotateTo(270, 0, 22.5)).toBe(337.5);
    expect(helpers.rotateTo(180, 174, 12)).toBe(180);
    expect(helpers.rotateTo(0, 354, 12)).toBe(0);
  });

  it("calculates headings from an origin to a target", () => {
    expect(helpers.findHeading({ posX: 0, posY: -10 })).toBe(180);
    expect(helpers.findHeading({ posX: 0, posY: 10 })).toBe(0);
    expect(helpers.findHeading({ posX: 10, posY: 0 })).toBe(270);
    expect(helpers.findHeading({ posX: -10, posY: 0 })).toBe(90);
  });

  it("detects circle collisions and area exits", () => {
    expect(
      helpers.detectCollision(
        { posX: 0, posY: 0, radius: 5 },
        { posX: 6, posY: 0, radius: 2 }
      )
    ).toBe(true);
    expect(
      helpers.detectAreaExit({ posX: 0, posY: 0 }, { posX: 10, posY: 0 }, 5)
    ).toBe(true);
  });

  it("binds one callback to multiple events", () => {
    const target = new EventTarget();
    const callback = vi.fn();

    helpers.bind("alpha beta", callback, target);
    target.dispatchEvent(new Event("alpha"));
    target.dispatchEvent(new Event("beta"));

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("unbinds callbacks registered through bind", () => {
    const target = new EventTarget();
    const callback = vi.fn();

    helpers.bind("alpha", callback, target);
    helpers.unbind("alpha");
    target.dispatchEvent(new Event("alpha"));

    expect(callback).not.toHaveBeenCalled();
  });

  it("generates valid bright six-digit CSS hex colors", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999999)
      .mockReturnValueOnce(0.999999)
      .mockReturnValueOnce(0.999999);

    expect(helpers.getRandomColor()).toBe("#e21212");
    expect(helpers.getRandomColor()).toBe("#ff292c");
  });

  it("clones nested objects without retaining references", () => {
    const original = { a: 1, nested: { b: 2 } };
    const clone = helpers.cloneObject(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.nested).not.toBe(original.nested);
  });
});
