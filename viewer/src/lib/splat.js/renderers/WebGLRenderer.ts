import type { Camera } from "../cameras/Camera";
import type { Scene } from "../core/Scene";
import type { Renderer } from "./Renderer";

import { getViewMatrix } from "./webgl/utils/transformations";
import { createWorker } from "./webgl/utils/worker";

import { vertex } from "./webgl/shaders/vertex.glsl";
import { frag } from "./webgl/shaders/frag.glsl";

export class WebGLRenderer implements Renderer {
    canvas: HTMLCanvasElement;

    activeCamera: Camera | null = null;
    activeScene: Scene | null = null;
    vertexCount: number = 0;

    gl: WebGLRenderingContext | null = null;
    ext: ANGLE_instanced_arrays | null = null;
    worker: Worker | null = null;

    projectionMatrix: number[] = [];
    vertexShader: WebGLShader | null = null;
    fragmentShader: WebGLShader | null = null;
    program: WebGLProgram | null = null;
    a_position: number = 0;
    a_center: number = 0;
    a_color: number = 0;
    a_covA: number = 0;
    a_covB: number = 0;
    vertexBuffer: WebGLBuffer | null = null;
    centerBuffer: WebGLBuffer | null = null;
    colorBuffer: WebGLBuffer | null = null;
    covABuffer: WebGLBuffer | null = null;
    covBBuffer: WebGLBuffer | null = null;

    constructor(canvas?: HTMLCanvasElement) {
        this.canvas =
            canvas ?? (document.createElementNS("http://www.w3.org/1999/xhtml", "canvas") as HTMLCanvasElement);
    }

    initWebGL() {
        this.gl = (this.canvas.getContext("webgl") ||
            this.canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
        this.ext = this.gl.getExtension("ANGLE_instanced_arrays") as ANGLE_instanced_arrays;

        this.worker = new Worker(
            URL.createObjectURL(
                new Blob(["(", createWorker.toString(), ")(self)"], {
                    type: "application/javascript",
                })
            )
        );

        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.activeCamera!.updateProjectionMatrix(this.canvas.width, this.canvas.height);

        let viewMatrix = getViewMatrix(this.activeCamera!);

        this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER) as WebGLShader;
        this.gl.shaderSource(this.vertexShader, vertex);
        this.gl.compileShader(this.vertexShader);
        if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(this.vertexShader));
        }

        this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER) as WebGLShader;
        this.gl.shaderSource(this.fragmentShader, frag);
        this.gl.compileShader(this.fragmentShader);
        if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(this.fragmentShader));
        }

        this.program = this.gl.createProgram() as WebGLProgram;
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(this.program));
        }

        this.gl.disable(this.gl.DEPTH_TEST); // Disable depth testing

        // Enable blending
        this.gl.enable(this.gl.BLEND);

        // Set blending function
        this.gl.blendFuncSeparate(this.gl.ONE_MINUS_DST_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_DST_ALPHA, this.gl.ONE);

        // Set blending equation
        this.gl.blendEquationSeparate(this.gl.FUNC_ADD, this.gl.FUNC_ADD);

        // projection
        const u_projection = this.gl.getUniformLocation(this.program, "projection");
        this.gl.uniformMatrix4fv(u_projection, false, this.projectionMatrix);

        // viewport
        const u_viewport = this.gl.getUniformLocation(this.program, "viewport");
        this.gl.uniform2fv(u_viewport, new Float32Array([this.canvas.width, this.canvas.height]));

        // focal
        const u_focal = this.gl.getUniformLocation(this.program, "focal");
        this.gl.uniform2fv(u_focal, new Float32Array([this.activeCamera!.fx, this.activeCamera!.fy]));

        // view
        const u_view = this.gl.getUniformLocation(this.program, "view");
        this.gl.uniformMatrix4fv(u_view, false, viewMatrix.buffer);

        // positions
        const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, triangleVertices, this.gl.STATIC_DRAW);

        this.a_position = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(this.a_position);
        this.gl.vertexAttribPointer(this.a_position, 2, this.gl.FLOAT, false, 0, 0);

        // center
        this.centerBuffer = this.gl.createBuffer();
        this.a_center = this.gl.getAttribLocation(this.program, "center");
        this.gl.enableVertexAttribArray(this.a_center);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.centerBuffer);
        this.gl.vertexAttribPointer(this.a_center, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_center, 1); // Use the extension here

        // color
        this.colorBuffer = this.gl.createBuffer();
        this.a_color = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(this.a_color);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(this.a_color, 4, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_color, 1); // Use the extension here

        // cov
        this.covABuffer = this.gl.createBuffer();
        this.a_covA = this.gl.getAttribLocation(this.program, "covA");
        this.gl.enableVertexAttribArray(this.a_covA);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covABuffer);
        this.gl.vertexAttribPointer(this.a_covA, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_covA, 1); // Use the extension here

        this.covBBuffer = this.gl.createBuffer();
        this.a_covB = this.gl.getAttribLocation(this.program, "covB");
        this.gl.enableVertexAttribArray(this.a_covB);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.covBBuffer);
        this.gl.vertexAttribPointer(this.a_covB, 3, this.gl.FLOAT, false, 0, 0);
        this.ext.vertexAttribDivisorANGLE(this.a_covB, 1); // Use the extension here

        this.worker.onmessage = (e) => {
            if (e.data.buffer) {
                this.activeScene!.setData(new Uint8Array(e.data.buffer));
                const blob = new Blob([this.activeScene!.data.buffer], {
                    type: "application/octet-stream",
                });
                const link = document.createElement("a");
                link.download = "model.splat";
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
            } else {
                let { covA, covB, center, color } = e.data;
                this.vertexCount = center.length / 3;

                const gl = this.gl!;

                gl.bindBuffer(gl.ARRAY_BUFFER, this.centerBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, center, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, color, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.covABuffer);
                gl.bufferData(gl.ARRAY_BUFFER, covA, gl.DYNAMIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.covBBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, covB, gl.DYNAMIC_DRAW);
            }
        };

        this.frame = () => {
            this.activeCamera!.updateProjectionMatrix(this.canvas.width, this.canvas.height);

            const viewProj = this.activeCamera!.projectionMatrix.multiply(viewMatrix);
            this.worker!.postMessage({ view: viewProj.buffer });

            if (this.vertexCount > 0) {
                this.gl!.uniformMatrix4fv(u_view, false, viewMatrix.buffer);
                this.ext!.drawArraysInstancedANGLE(this.gl!.TRIANGLE_FAN, 0, 4, this.vertexCount);
            } else {
                this.gl!.clear(this.gl!.COLOR_BUFFER_BIT);
            }
        };
    }

    frame: () => void = () => {};

    render(scene: Scene, camera: Camera) {
        if (this.activeScene !== scene || this.activeCamera !== camera) {
            if (this.activeScene !== null && this.activeCamera !== null) {
                this.dispose();
            }

            this.activeScene = scene;
            this.activeCamera = camera;
            this.initWebGL();
        }

        this.frame();
    }

    dispose() {}
}
