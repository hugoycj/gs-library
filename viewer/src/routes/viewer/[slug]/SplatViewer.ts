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

        this.handleResize = this.handleResize.bind(this);
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

        this.handleResize();
        window.addEventListener("resize", this.handleResize);

        requestAnimationFrame(frame);
    }

    handleResize() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    dispose() {
        window.removeEventListener("resize", this.handleResize);

        this.controls.dispose();
        this.renderer.dispose();

        this.disposed = true;
    }

    async capture(): Promise<string | null> {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = 512;
                offscreenCanvas.height = 512;
                const offscreenContext = offscreenCanvas.getContext("2d") as CanvasRenderingContext2D;

                const x = (this.canvas.width - offscreenCanvas.width) / 2;
                const y = (this.canvas.height - offscreenCanvas.height) / 2;

                offscreenContext.drawImage(
                    this.canvas,
                    x,
                    y,
                    offscreenCanvas.width,
                    offscreenCanvas.height,
                    0,
                    0,
                    offscreenCanvas.width,
                    offscreenCanvas.height
                );
                const dataUrl = offscreenCanvas.toDataURL("image/png");
                offscreenCanvas.remove();

                resolve(dataUrl);
            });
        });
    }

    getStats(): { name: string; value: any }[] {
        return [];
    }
}
