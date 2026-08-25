import type {
  EnvironmentProfile,
  SpaceBackdropTheme,
} from "../gameplay/Environment";

export interface SpaceBackdropCssVariables {
  readonly deep: string;
  readonly horizon: string;
  readonly nebulaPrimary: string;
  readonly nebulaSecondary: string;
  readonly star: string;
  readonly accentStar: string;
  readonly celestial: string;
  readonly celestialX: string;
  readonly celestialY: string;
  readonly celestialCore: string;
  readonly nebulaX: string;
  readonly nebulaY: string;
  readonly starOffsetX: string;
  readonly starOffsetY: string;
}

function cssHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function spaceBackdropCssVariables(
  theme: SpaceBackdropTheme,
): SpaceBackdropCssVariables {
  return Object.freeze({
    deep: cssHex(theme.deepColor),
    horizon: cssHex(theme.horizonColor),
    nebulaPrimary: cssHex(theme.nebulaPrimaryColor),
    nebulaSecondary: cssHex(theme.nebulaSecondaryColor),
    star: cssHex(theme.starColor),
    accentStar: cssHex(theme.accentStarColor),
    celestial: cssHex(theme.celestialColor),
    celestialX: `${50 + theme.celestialDirection.x * 32}%`,
    celestialY: `${44 - theme.celestialDirection.y * 42}%`,
    celestialCore: `${theme.celestialAngularRadius * 26}%`,
    nebulaX: `${18 + theme.variant * 13}%`,
    nebulaY: `${28 + (theme.variant % 3) * 17}%`,
    starOffsetX: `${theme.variant * 19}px`,
    starOffsetY: `${theme.variant * -13}px`,
  });
}

export class SpaceBackdrop {
  readonly #element: HTMLDivElement;

  constructor(container: HTMLElement, environment: EnvironmentProfile) {
    this.#element = document.createElement("div");
    this.#element.className = "deep-space-backdrop";
    this.#element.dataset.testid = "deep-space-backdrop";
    this.#element.dataset.artStyle = "painted-pinball-backglass";
    this.#element.setAttribute("aria-hidden", "true");
    container.prepend(this.#element);
    this.setEnvironment(environment);
  }

  setEnvironment(environment: EnvironmentProfile): void {
    const theme = environment.spaceBackdrop;
    const variables = spaceBackdropCssVariables(theme);
    this.#element.dataset.spaceTheme = theme.id;
    this.#element.dataset.spaceLabel = theme.label;
    this.#element.style.setProperty("--space-deep", variables.deep);
    this.#element.style.setProperty("--space-horizon", variables.horizon);
    this.#element.style.setProperty(
      "--space-nebula-primary",
      variables.nebulaPrimary,
    );
    this.#element.style.setProperty(
      "--space-nebula-secondary",
      variables.nebulaSecondary,
    );
    this.#element.style.setProperty("--space-star", variables.star);
    this.#element.style.setProperty(
      "--space-accent-star",
      variables.accentStar,
    );
    this.#element.style.setProperty("--space-celestial", variables.celestial);
    this.#element.style.setProperty(
      "--space-celestial-x",
      variables.celestialX,
    );
    this.#element.style.setProperty(
      "--space-celestial-y",
      variables.celestialY,
    );
    this.#element.style.setProperty(
      "--space-celestial-core",
      variables.celestialCore,
    );
    this.#element.style.setProperty("--space-nebula-x", variables.nebulaX);
    this.#element.style.setProperty("--space-nebula-y", variables.nebulaY);
    this.#element.style.setProperty(
      "--space-star-offset-x",
      variables.starOffsetX,
    );
    this.#element.style.setProperty(
      "--space-star-offset-y",
      variables.starOffsetY,
    );
  }

  dispose(): void {
    this.#element.remove();
  }
}
