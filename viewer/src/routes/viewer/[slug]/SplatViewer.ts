import type { IViewer } from "./IViewer";
import * as SPLAT from "gsplat";

export class SplatViewer implements IViewer {
    canvas: HTMLCanvasElement;

    renderer: SPLAT.WebGLRenderer;
    scene: SPLAT.Scene;
    camera: SPLAT.Camera;
    controls: SPLAT.OrbitControls;

    disposed: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.renderer = new SPLAT.WebGLRenderer(canvas);
        this.scene = new SPLAT.Scene();
        this.camera = new SPLAT.Camera();
        this.controls = new SPLAT.OrbitControls(this.camera, canvas);
    }

    async loadScene(url: string, loadingBarCallback?: (progress: number) => void) {
        await SPLAT.Loader.LoadAsync(url, this.scene, (progress) => {
            loadingBarCallback?.(progress);
        });

        const frame = () => {
            this.controls.update();
            this.renderer.render(this.scene, this.camera);

            if (!this.disposed) {
                requestAnimationFrame(frame);
            }
        };

        this.disposed = false;

        requestAnimationFrame(frame);
    }

    dispose() {
        this.controls.dispose();
        this.renderer.dispose();

        this.disposed = true;
    }

    async capture(): Promise<string | null> {
        return null;
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
