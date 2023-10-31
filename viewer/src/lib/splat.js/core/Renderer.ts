import type { Scene } from './Scene';
import type { Camera } from './Camera';

export interface Renderer {
    render(scene: Scene, camera: Camera): void;
}
