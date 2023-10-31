import type { Camera } from "../core/Camera";
import type { Renderer } from "../core/Renderer";

export class WebGLRenderer implements Renderer {
    canvas: HTMLCanvasElement;

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas =
            canvas ?? (document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement);
    }

    render(camera: Camera): void {}
}
