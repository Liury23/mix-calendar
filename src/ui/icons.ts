/** SVG icon factory functions for Mix Calendar */

export function dotIcon(color: string = "currentColor", size: number = 5): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}" />
  </svg>`;
}

export function createSvgIcon(htmlString: string): HTMLElement {
  const span = document.createElement("span");
  span.innerHTML = htmlString;
  return span;
}
