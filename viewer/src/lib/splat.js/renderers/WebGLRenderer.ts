import type { Camera } from "../cameras/Camera";
import type { Scene } from "../core/Scene";
import type { Renderer } from "./Renderer";

export class WebGLRenderer implements Renderer {
    canvas: HTMLCanvasElement;

    gl: WebGLRenderingContext;
    ext: ANGLE_instanced_arrays;

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas =
            canvas ?? (document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement);
        this.gl = this.canvas.getContext("webgl") as WebGLRenderingContext;
        this.ext = this.gl.getExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;
    }

    render(scene: Scene, camera: Camera): void {}
    dispose(): void {}
}
