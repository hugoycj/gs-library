import type { Camera } from "../cameras/Camera";
import type { PerspectiveCamera } from "../cameras/PerspectiveCamera";
import type { Scene } from "../core/Scene";
import type { Renderer } from "./Renderer";

import { getViewMatrix } from "./webgl/utils/transformations";
import { createWorker } from "./webgl/utils/worker";

import { vertex } from "./webgl/shaders/vertex.glsl";
import { frag } from "./webgl/shaders/frag.glsl";
import type { Matrix4 } from "../math/Matrix4";

export class WebGLRenderer implements Renderer {
    canvas: HTMLCanvasElement;

    render: (scene: Scene, camera: Camera) => void;
    dispose: () => void;

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas =
            canvas ?? (document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement);

        const gl = (this.canvas.getContext("webgl") ||
            this.canvas.getContext("experimental-webgl")) as WebGLRenderingContext;

        let ext: ANGLE_instanced_arrays;
        let worker: Worker;
        let vertexShader: WebGLShader;
        let fragmentShader: WebGLShader;
        let program: WebGLProgram;

        let u_projection: WebGLUniformLocation;
        let u_viewport: WebGLUniformLocation;
        let u_focal: WebGLUniformLocation;
        let u_view: WebGLUniformLocation;

        let vertexLocation: number;
        let centerLocation: number;
        let colorLocation: number;
        let covALocation: number;
        let covBLocation: number;

        let vertexBuffer: WebGLBuffer;
        let centerBuffer: WebGLBuffer;
        let colorBuffer: WebGLBuffer;
        let covABuffer: WebGLBuffer;
        let covBBuffer: WebGLBuffer;

        function initGLContext(width: number, height: number, scene: Scene, camera: PerspectiveCamera) {
            ext = gl.getExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;

            worker = new Worker(
                URL.createObjectURL(
                    new Blob(["(", createWorker.toString(), ")(self)"], {
                        type: "application/javascript",
                    })
                )
            );

            // Viewport
            gl.viewport(0, 0, width, height);
            camera.updateProjectionMatrix(width, height);

            // Vertex shader
            vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
            gl.shaderSource(vertexShader, vertex);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(vertexShader));
            }

            // Fragment shader
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
            gl.shaderSource(fragmentShader, frag);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(fragmentShader));
            }

            // Program
            program = gl.createProgram() as WebGLProgram;
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program));
            }

            // Blending
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

            // Uniforms
            u_projection = gl.getUniformLocation(program, "projection") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_projection, false, camera.projectionMatrix.buffer);

            u_viewport = gl.getUniformLocation(program, "viewport") as WebGLUniformLocation;
            gl.uniform2fv(u_viewport, new Float32Array([width, height]));

            u_focal = gl.getUniformLocation(program, "focal") as WebGLUniformLocation;
            gl.uniform2fv(u_focal, new Float32Array([camera.fx, camera.fy]));

            const viewMatrix = getViewMatrix(camera);
            u_view = gl.getUniformLocation(program, "view") as WebGLUniformLocation;
            gl.uniformMatrix4fv(u_view, false, viewMatrix.buffer);

            // Vertex buffer
            const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
            vertexBuffer = gl.createBuffer() as WebGLBuffer;

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

            vertexLocation = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(vertexLocation);
            gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);

            // Center buffer
            centerBuffer = gl.createBuffer() as WebGLBuffer;
            centerLocation = gl.getAttribLocation(program, "center");

            gl.enableVertexAttribArray(centerLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
            gl.vertexAttribPointer(centerLocation, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(centerLocation, 1);

            // Color buffer
            colorBuffer = gl.createBuffer() as WebGLBuffer;
            colorLocation = gl.getAttribLocation(program, "color");

            gl.enableVertexAttribArray(colorLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(colorLocation, 1);

            // Covariance A buffer
            covABuffer = gl.createBuffer() as WebGLBuffer;
            covALocation = gl.getAttribLocation(program, "covA");

            gl.enableVertexAttribArray(covALocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, covABuffer);
            gl.vertexAttribPointer(covALocation, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(covALocation, 1);

            // Covariance B buffer
            covBBuffer = gl.createBuffer() as WebGLBuffer;
            covBLocation = gl.getAttribLocation(program, "covB");

            gl.enableVertexAttribArray(covBLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, covBBuffer);
            gl.vertexAttribPointer(covBLocation, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(covBLocation, 1);

            worker.onmessage = (e) => {
                if (e.data.center) {
                    let { covA, covB, center, color } = e.data;

                    gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, center, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, covABuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, covA, gl.DYNAMIC_DRAW);

                    gl.bindBuffer(gl.ARRAY_BUFFER, covBBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, covB, gl.DYNAMIC_DRAW);
                }
            };
        }

        let currentScene: Scene | null = null;
        let currentCamera: Camera | null = null;

        this.render = function (scene: Scene, camera: Camera) {
            if (scene !== currentScene || camera !== currentCamera) {
                const perspectiveCamera = camera as PerspectiveCamera;
                if (perspectiveCamera == null) {
                    throw new Error("Camera is not a PerspectiveCamera");
                }

                if (currentScene != null || currentCamera != null) {
                    this.dispose();
                }

                currentScene = scene;
                currentCamera = camera;

                initGLContext(this.canvas.width, this.canvas.height, scene, perspectiveCamera);
            }
        };

        this.dispose = function () {
            gl.deleteBuffer(vertexBuffer);
            gl.deleteBuffer(centerBuffer);
            gl.deleteBuffer(colorBuffer);
            gl.deleteBuffer(covABuffer);
            gl.deleteBuffer(covBBuffer);

            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);

            worker.terminate();
        };
    }
}
