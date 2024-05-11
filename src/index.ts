import * as tgt from "@game.object/ts-game-toolbox";
import { App } from "./App";

const input = tgt.get_element_by_id("token", HTMLInputElement);
const app = tgt.get_element_by_id("app", HTMLElement);
const table = tgt.get_element_by_id("time-trackings-table", HTMLTableElement);
const refresh = tgt.get_element_by_id("refresh", HTMLButtonElement);
const chart = tgt.get_element_by_id("chart", SVGElement);

new App(app, input, table, refresh, chart);

try {
    const token = localStorage.getItem("token");
    if (token) {
        input.value = token;
        input.dispatchEvent(new Event("change"));
    }
    input.addEventListener("change", () => {
        localStorage.setItem("token", input.value);
    });
} catch (error) {
    console.error(error);
}