import { Camera } from "./Camera";

class PerspectiveCamera extends Camera {
    fx: number;
    fy: number;

    near: number;
    far: number;

    constructor(fx: number = 1132, fy: number = 1132, near: number = 0.1, far: number = 100) {
        super();

        this.fx = fx;
        this.fy = fy;
        this.near = near;
        this.far = far;
    }

    updateProjectionMatrix(width: number, height: number): void {
        // prettier-ignore
        this.projectionMatrix.set(
            2 * this.fx / width, 0, 0, 0,
            0, -2 * this.fy / height, 0, 0,
            0, 0, this.far / (this.far - this.near), 1,
            0, 0, -this.near * this.far / (this.far - this.near), 0
        );
    }
}

export { PerspectiveCamera };
