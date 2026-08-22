import "./styles/main.css";
import { Game } from "./core/Game";

const container = document.querySelector<HTMLElement>("#app");
if (!container) {
  throw new Error("NIBBLES could not find the application root.");
}

const game = new Game(container);
void game.start();

window.addEventListener("beforeunload", () => game.dispose(), { once: true });
