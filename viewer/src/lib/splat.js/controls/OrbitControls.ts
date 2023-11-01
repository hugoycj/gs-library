import type { Camera } from "../cameras/Camera";
import { EventDispatcher } from "../core/EventDispatcher";
import { Matrix3 } from "../math/Matrix3";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

class OrbitControls extends EventDispatcher {
    camera: Camera;
    domElement: HTMLElement;

    target: Vector3 = new Vector3();
    alpha: number = 0;
    beta: number = 0;
    radius: number = 5;

    desiredTarget: Vector3;
    desiredAlpha: number;
    desiredBeta: number;
    desiredRadius: number;

    minBeta: number = (5 * Math.PI) / 180;
    maxBeta: number = (85 * Math.PI) / 180;
    minZoom: number = 0.1;
    maxZoom: number = 30;
    orbitSpeed: number = 1;
    panSpeed: number = 1;
    zoomSpeed: number = 1;
    dampening: number = 10;

    constructor(camera: Camera, domElement: HTMLElement) {
        super();

        this.camera = camera;
        this.domElement = domElement;

        this.desiredTarget = this.target.clone();
        this.desiredAlpha = this.alpha;
        this.desiredBeta = this.beta;
        this.desiredRadius = this.radius;
    }

    lerp(a: number, b: number, t: number) {
        return (1 - t) * a + t * b;
    }

    pan(dx: number, dy: number) {
        const R = this.camera.rotation.buffer;
        const right = new Vector3(R[0], R[3], R[6]);
        const up = new Vector3(R[1], R[4], R[7]);
        this.desiredTarget.add(right.multiply(dx));
        this.desiredTarget.add(up.multiply(dy));
    }

    update(deltaTime: number) {
        this.alpha = this.lerp(this.alpha, this.desiredAlpha, this.dampening * deltaTime);
        this.beta = this.lerp(this.beta, this.desiredBeta, this.dampening * deltaTime);
        this.radius = this.lerp(this.radius, this.desiredRadius, this.dampening * deltaTime);
        this.target = this.target.lerp(this.desiredTarget, this.dampening * deltaTime);

        const x = this.target.x + this.radius * Math.sin(this.alpha) * Math.cos(this.beta);
        const y = this.target.y - this.radius * Math.sin(this.beta);
        const z = this.target.z - this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
        this.camera.position.set(x, y, z);

        const direction = this.target.clone().subtract(this.camera.position).normalize();
        const rx = Math.asin(-direction.y);
        const ry = Math.atan2(direction.x, direction.z);
        this.camera.rotation = Matrix3.RotationFromEuler(new Vector3(rx, ry, 0));
    }
}

export { OrbitControls };
