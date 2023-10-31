import type { IViewer } from "./IViewer";
import * as SPLAT from "$lib/splat.js";

export class SplatViewer implements IViewer {
    scene: SPLAT.Scene;
    camera: SPLAT.Camera;
    renderer: SPLAT.Renderer;
    disposed: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new SPLAT.Scene();
        this.camera = new SPLAT.PerspectiveCamera();
        this.renderer = new SPLAT.WebGLRenderer(canvas);
    }

    async loadScene(url: string, onProgress?: (progress: number) => void) {
        await SPLAT.Loader.LoadAsync(url, this.scene, onProgress);

        const frame = () => {
            this.renderer.render(this.scene, this.camera);

            if (!this.disposed) {
                requestAnimationFrame(frame);
            }
        };

        this.disposed = false;
        requestAnimationFrame(frame);
    }

    dispose() {
        this.disposed = true;
    }

    async capture(): Promise<string | null> {
        return null;
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
