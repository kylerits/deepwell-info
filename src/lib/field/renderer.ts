import FRAG from './field.frag.glsl?raw';
import MOTE_VERT from './mote.vert.glsl?raw';
import MOTE_FRAG from './mote.frag.glsl?raw';
import type { FrameData } from './frame';

export const DPR_CAP = 1.5;
export const RES_SCALE = 0.5;
const FULL_VERT = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

export interface FieldRenderer { resize(w: number, h: number, dpr: number): void; draw(f: FrameData): void; dispose(): void }

function program(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram | null {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type); if (!s) return null;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram(); if (!p) return null;
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { gl.deleteProgram(p); return null; }
  return p;
}

/** Null when WebGL2 is unavailable or a shader fails: the caller keeps the static CSS field. */
export function createFieldRenderer(canvas: HTMLCanvasElement): FieldRenderer | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const field = program(gl, FULL_VERT, FRAG), motes = program(gl, MOTE_VERT, MOTE_FRAG);
  if (!field || !motes) { if (field) gl.deleteProgram(field); if (motes) gl.deleteProgram(motes); return null; }

  const emptyVao = gl.createVertexArray();
  const moteVao = gl.createVertexArray(), moteBuf = gl.createBuffer();
  gl.bindVertexArray(moteVao); gl.bindBuffer(gl.ARRAY_BUFFER, moteBuf);
  const aPos = gl.getAttribLocation(motes, 'aPos'), aSA = gl.getAttribLocation(motes, 'aSizeAlpha');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aSA); gl.vertexAttribPointer(aSA, 2, gl.FLOAT, false, 16, 8);
  gl.bindVertexArray(null);

  const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const U = { res: u(field, 'uRes'), px: u(field, 'uPxScale'), base: u(field, 'uBase'), bloom: u(field, 'uBloom'),
    volA: u(field, 'uVolA[0]'), volC: u(field, 'uVolC[0]'), volStop: u(field, 'uVolStop[0]'), count: u(field, 'uShaftCount'),
    shA: u(field, 'uShaftA[0]'), shB: u(field, 'uShaftB[0]'), breath: u(field, 'uBreath'), presence: u(field, 'uPresence') };
  const M = { res: u(motes, 'uRes'), px: u(motes, 'uPxScale') };
  let cssW = 1, cssH = 1, scale = 1;

  return {
    resize(w, h, dpr) {
      cssW = Math.max(1, w); cssH = Math.max(1, h); scale = Math.min(dpr || 1, DPR_CAP) * RES_SCALE;
      const bw = Math.max(1, Math.round(cssW * scale)), bh = Math.max(1, Math.round(cssH * scale));
      // Assigning width/height (even unchanged) clears the buffer to #000: only touch it on a real change.
      if (bw === canvas.width && bh === canvas.height) return;
      canvas.width = bw; canvas.height = bh;
      gl.viewport(0, 0, bw, bh);
    },
    draw(f) {
      gl.disable(gl.BLEND);
      gl.useProgram(field);
      gl.uniform2f(U.res, cssW, cssH); gl.uniform1f(U.px, scale); gl.uniform3fv(U.base, f.base); gl.uniform1f(U.bloom, f.bloom);
      gl.uniform4fv(U.volA, f.volA); gl.uniform4fv(U.volC, f.volC); gl.uniform1fv(U.volStop, f.volStop);
      gl.uniform1i(U.count, f.shaftCount); gl.uniform4fv(U.shA, f.shaftA); gl.uniform4fv(U.shB, f.shaftB);
      gl.uniform1f(U.breath, f.breath); gl.uniform3fv(U.presence, f.presence);
      gl.bindVertexArray(emptyVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (f.moteCount > 0) {
        gl.useProgram(motes); gl.uniform2f(M.res, cssW, cssH); gl.uniform1f(M.px, scale);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(moteVao); gl.bindBuffer(gl.ARRAY_BUFFER, moteBuf);
        gl.bufferData(gl.ARRAY_BUFFER, f.motes, gl.DYNAMIC_DRAW); gl.drawArrays(gl.POINTS, 0, f.moteCount);
      }
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteProgram(field); gl.deleteProgram(motes); gl.deleteBuffer(moteBuf);
      gl.deleteVertexArray(moteVao); gl.deleteVertexArray(emptyVao);
    },
  };
}
