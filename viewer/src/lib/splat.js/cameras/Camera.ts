import { Object3D } from "../core/Object3D";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

class Camera extends Object3D {
    projectionMatrix: Matrix4;

    constructor(position: Vector3 = new Vector3(0, 0, -5)) {
        super();

        this.position = position;
        this.projectionMatrix = new Matrix4();
    }

    updateProjectionMatrix(width: number, height: number): void {}
}

export { Camera };
