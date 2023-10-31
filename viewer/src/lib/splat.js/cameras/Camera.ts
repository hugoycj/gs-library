import { Object3D } from "../core/Object3D";
import { Matrix4 } from "../math/Matrix4";

export class Camera extends Object3D {
    projectionMatrix: Matrix4;

    constructor() {
        super();

        this.projectionMatrix = new Matrix4();
    }
}
