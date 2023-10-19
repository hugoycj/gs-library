import type { IViewer } from "./IViewer";

export class SplatViewer implements IViewer {
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

    }

    async loadModel(url: string, loadingBarCallback?: (progress: number) => void) {
        this.draw();
    }

    draw = () => {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const text = "Under Construction";
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.fillText(text, centerX, centerY);

        requestAnimationFrame(this.draw);
    }

    dispose() {

    }

    async capture() {
        return null;
    }

    getStats(): { name: string, value: any }[] {
        return [];
    }
}