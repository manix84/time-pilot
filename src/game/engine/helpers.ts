/* Converted from engine/helpers.js (AMD) to ESM TypeScript. */
import type { Coordinates, Heading, PositionedRadius } from "./types";

interface LegacyEventTarget extends EventTarget {
  attachEvent?: (eventName: string, callback: EventListener) => void;
  detachEvent?: (eventName: string, callback: EventListener) => void;
}

interface Helpers {
  float: (number: number) => number;
  rotateTo: (
    destinationAngle: Heading,
    currentAngle: Heading,
    stepSize: number
  ) => Heading;
  getSpawnCoords: (
    target: Coordinates & { heading: Heading },
    options?: { spawnArc?: number; spawnRadius?: number }
  ) => Coordinates;
  findHeading: (target: Coordinates, origin?: Coordinates) => Heading;
  detectCollision: (
    target: PositionedRadius,
    origin?: PositionedRadius
  ) => boolean;
  detectAreaExit: (
    radialCenter: Coordinates,
    target: Coordinates,
    radius: number
  ) => boolean;
  bind: (
    eventNames: string | string[],
    callback: EventListener,
    element?: LegacyEventTarget
  ) => void;
  unbind: (...eventNames: string[]) => void;
  getRandomColor: () => string;
  cloneObject: <T>(oldObject: T) => T;
}

const boundListeners: Array<{
  callback: EventListener;
  element: LegacyEventTarget;
  eventName: string;
}> = [];

var helpers: Helpers = {
  /**
   * Takes an extremely long number and reduces it decimal place to 5.
   * @method
   * @param   {Number} number - The number you wish to be cleaned up.
   * @returns {Float}
   */
  float: (number: number): number => {
    return parseFloat(number.toFixed(5));
  },

  /**
   * Given the current angle and the desired angle, try to get their using the limited step size provided.
   * @method
   * @param   {Number} destinationAngle
   * @param   {Number} currentAngle
   * @param   {Number} stepSize         - Number of degrees that can be moved at a time.
   * @returns {Number}
   */
  rotateTo: (destinationAngle: Heading, currentAngle: Heading, stepSize: number): Heading => {
    const angleDelta =
      ((destinationAngle - currentAngle + 540) % 360) - 180;

    if (Math.abs(angleDelta) <= stepSize) {
      return (destinationAngle + 360) % 360;
    }

    var direction = Math.atan2(
      parseFloat(
        Math.sin((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(
          15
        )
      ),
      parseFloat(
        Math.cos((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(
          15
        )
      )
    );

    if (direction > 0) {
      currentAngle += stepSize;
    } else if (direction < 0) {
      currentAngle -= stepSize;
    }
    currentAngle += currentAngle >= 360 ? -360 : currentAngle < 0 ? 360 : 0;

    return currentAngle;
  },

  /**
   * Takes the player's position and heading then returns a random spawning location within that.
   * @method
   * @param     {Object} target
   * @property  {Number} target.heading     - Heading of the target.
   * @property  {Number} target.posX        - X position of the target.
   * @property  {Number} target.posY        - Y position of the target.
   * @returns {Object}
   */
  getSpawnCoords: (target: Coordinates & { heading: Heading }, options: { spawnArc?: number; spawnRadius?: number } = {}): Coordinates => {
    var data: Coordinates = {
      posX: target.posX,
      posY: target.posY,
    };
    var spawnRadius = options.spawnRadius ?? 450,
      spawnArc = options.spawnArc ?? 80,
      heading;

    heading =
      target.heading - spawnArc / 2 + Math.floor(Math.random() * spawnArc);

    data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * spawnRadius
    );
    data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * spawnRadius
    );

    return data;
  },

  /**
   *
   * @method
   * @param     {Object} target               - Object containing posX and posY
   * @property  {Number} target.posX          - X position of the target.
   * @property  {Number} target.posY          - Y position of the target.
   * @property  {Number} target.heading       - Heading of the target.
   * @param     {Object} [origin]             - Object containing posX and posY
   * @property  {Number} [origin.posX]        - X position of the origin.
   * @property  {Number} [origin.posY]        - Y position of the origin.
   * @property  {Number} [origin.heading]     - Heading of the origin.
   * @returns {Float} The number of degrees to turn (+/-) to be pointing towards target.
   */
  findHeading: (target: Coordinates, origin?: Coordinates): Heading => {
    origin = origin || {
      posX: 0,
      posY: 0,
    };
    var heading =
      Math.atan2(target.posX - origin.posX, target.posY - origin.posY) *
      (180 / Math.PI);
    return heading > 0 ? 360 - heading : Math.abs(heading);
  },

  /**
   * Detect if two object impact each other.
   * @method
   * @param     {Object} target               - Object containing posX, posY, and Radius of the target.
   * @property  {Number} target.posX          - X position of the target.
   * @property  {Number} target.posY          - Y position of the target.
   * @property  {Number} target.radius        - Radius of the target.
   * @param     {Object} [origin]             - Object containing posX, posY and Radius of the origin.
   * @property  {Number} [origin.posX]        - X position of the origin.
   * @property  {Number} [origin.posY]        - Y position of the origin.
   * @property  {Number} [origin.radius]      - Radius of the origin.
   * @returns {Boolean}
   */
  detectCollision: (target: PositionedRadius, origin?: PositionedRadius): boolean => {
    origin = origin || {
      posX: 0,
      posY: 0,
      radius: 0,
    };
    var dx = target.posX - origin.posX,
      dy = target.posY - origin.posY,
      dist = target.radius + origin.radius;

    return dx * dx + dy * dy <= dist * dist;
  },

  /**
   * Detect if a point is within a specified distance of a radial center.
   * @method
   * @param     {Object} radialCenter         - Object containing posX and posY.
   * @property  {Number} radialCenter.posX    - X position of the radialCenter.
   * @property  {Number} radialCenter.posY    - Y position of the radialCenter.
   * @param     {Object} target               - Object containing posX and posY.
   * @property  {Number} target.posX          - X position of the target.
   * @property  {Number} target.posY          - Y position of the target.
   * @param     {Number} radius               - Distance from the radial center to be considered inside.
   * @returns   {Boolean}
   */
  detectAreaExit: (radialCenter: Coordinates, target: Coordinates, radius: number): boolean => {
    var dx = radialCenter.posX - target.posX,
      dy = radialCenter.posY - target.posY;

    return dx * dx + dy * dy >= radius * radius;
  },

  /**
   * Bind to a given list of events
   * @method
   * @param   {String|Array}  eventNames      - Either a space delimited string or an array of events to listen to
   * @param   {Function}      callback        - Function to be run when the event is fired.
   * @param   {DOM Node}      [element=body]  - Element to attach the listener too.
   */
  bind: (eventNames: string | string[], callback: EventListener, element?: LegacyEventTarget): void => {
    element = element || document.documentElement;

    if (typeof eventNames === "string") {
      eventNames = eventNames.split(" ");
    }

    for (var i = 0, l = eventNames.length; i < l; ++i) {
      if (typeof element.addEventListener === "function") {
        element.addEventListener(eventNames[i], callback, false);
      } else if (element.attachEvent) {
        element.attachEvent("on" + eventNames[i], callback);
      }

      boundListeners.push({
        callback,
        element,
        eventName: eventNames[i],
      });
    }
  },

  /**
   * Unbind event.
   * @method unbind
   */
  unbind: (...eventNames: string[]): void => {
    const eventsToRemove = new Set(eventNames);

    for (let i = boundListeners.length - 1; i >= 0; i--) {
      const listener = boundListeners[i];

      if (eventsToRemove.size && !eventsToRemove.has(listener.eventName)) {
        continue;
      }

      if (typeof listener.element.removeEventListener === "function") {
        listener.element.removeEventListener(
          listener.eventName,
          listener.callback,
          false
        );
      } else if (listener.element.detachEvent) {
        listener.element.detachEvent("on" + listener.eventName, listener.callback);
      }

      boundListeners.splice(i, 1);
    }
  },

  /**
   * Generate a bright, saturated HEX colour value.
   * @method getRandomColor
   * @return {String} #0-F(6)
   */
  getRandomColor: (): string => {
    var hue = Math.floor(Math.random() * 360),
      saturation = 85 + Math.random() * 15,
      lightness = 48 + Math.random() * 10,
      chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100),
      huePrime = hue / 60,
      x = chroma * (1 - Math.abs((huePrime % 2) - 1)),
      match = lightness / 100 - chroma / 2,
      red = 0,
      green = 0,
      blue = 0;

    if (huePrime < 1) {
      red = chroma;
      green = x;
    } else if (huePrime < 2) {
      red = x;
      green = chroma;
    } else if (huePrime < 3) {
      green = chroma;
      blue = x;
    } else if (huePrime < 4) {
      green = x;
      blue = chroma;
    } else if (huePrime < 5) {
      red = x;
      blue = chroma;
    } else {
      red = chroma;
      blue = x;
    }

    return [red, green, blue]
      .map((channel) =>
        Math.round((channel + match) * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .replace(/^/, "#");
  },

  /**
   * Clone the object passed in and respond with a copy. Note that this is not a linked object.
   * @method cloneObject
   * @param  {Object}    oldObject The object you want to be cloned.
   * @return {Object}    The new cloned object.
   */
  cloneObject: <T>(oldObject: T): T => {
    var newObject = {} as T;
    for (var prop in oldObject) {
      if (typeof oldObject[prop] !== "object") {
        newObject[prop] = oldObject[prop];
      } else {
        newObject[prop] = helpers.cloneObject(oldObject[prop]);
      }
    }
    return newObject;
  },
};

export default helpers;
