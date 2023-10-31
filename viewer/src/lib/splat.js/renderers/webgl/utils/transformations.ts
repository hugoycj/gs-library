import type { Camera } from "$lib/splat.js/cameras/Camera";
import { Vector3 } from "$lib/splat.js/math/Vector3";
import { Matrix3 } from "$lib/splat.js/math/Matrix3";
import { Matrix4 } from "$lib/splat.js/math/Matrix4";
import type { Quaternion } from "$lib/splat.js/math/Quaternion";

export function quaternionToEuler(q: Quaternion) {
    return new Vector3(
        Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)),
        Math.asin(2 * (q.w * q.y - q.z * q.x)),
        Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
    );
}

export function eulerToMatrix(v: Vector3) {
    const x = v.x;
    const y = v.y;
    const z = v.z;

    const cx = Math.cos(x);
    const sx = Math.sin(x);
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cz = Math.cos(z);
    const sz = Math.sin(z);

    const rotationMatrix = [
        cy * cz + sy * sx * sz,
        -cy * sz + sy * sx * cz,
        sy * cx,
        cx * sz,
        cx * cz,
        -sx,
        -sy * cz + cy * sx * sz,
        sy * sz + cy * sx * cz,
        cy * cx,
    ];

    return new Matrix4(...rotationMatrix);
}

export function quatToMatrix(q: Quaternion) {
    const x = q.x;
    const y = q.y;
    const z = q.z;
    const w = q.w;

    const xx = x * x;
    const xy = x * y;
    const xz = x * z;
    const xw = x * w;
    const yy = y * y;
    const yz = y * z;
    const yw = y * w;
    const zz = z * z;
    const zw = z * w;

    const rotationMatrix = [
        1 - 2 * (yy + zz),
        2 * (xy - zw),
        2 * (xz + yw),
        2 * (xy + zw),
        1 - 2 * (xx + zz),
        2 * (yz - xw),
        2 * (xz - yw),
        2 * (yz + xw),
        1 - 2 * (xx + yy),
    ];

    return new Matrix3(...rotationMatrix);
}

export function getViewMatrix(camera: Camera) {
    const R = quatToMatrix(camera.rotation).buffer;
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
