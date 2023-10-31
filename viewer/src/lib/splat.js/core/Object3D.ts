import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";

export class Object3D {
    position: Vector3;
    rotation: Quaternion;

    constructor() {
        this.position = new Vector3();
        this.rotation = new Quaternion();
    }
}
