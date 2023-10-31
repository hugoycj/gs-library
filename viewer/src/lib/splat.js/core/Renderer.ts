import type { Camera } from "./Camera";

export interface Renderer {
    render(camera: Camera): void;
}
