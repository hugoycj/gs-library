import type { Camera } from "../cameras/Camera";

export interface Renderer {
    render(camera: Camera): void;
    setData(data: Uint8Array): void;
}
