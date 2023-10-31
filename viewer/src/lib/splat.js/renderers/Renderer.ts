import type { Camera } from "../cameras/Camera";
import type { Scene } from "../core/Scene";

class Renderer {
    render(scene: Scene, camera: Camera): void {}
    dispose(): void {}
}

export { Renderer };
