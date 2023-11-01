import type { Camera } from "$lib/splat.js/cameras/Camera";
import { Matrix4 } from "$lib/splat.js/math/Matrix4";

export function getViewMatrix(camera: Camera) {
    const R = camera.rotation.buffer;
    const t = camera.position.flat();
    const camToWorld = [
        [R[0], R[1], R[2], 0],
        [R[3], R[4], R[5], 0],
        [R[6], R[7], R[8], 0],
        [
            -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
            -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
            -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
            1,
        ],
    ].flat();
    return new Matrix4(...camToWorld);
}
