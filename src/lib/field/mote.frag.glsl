#version 300 es
precision mediump float;
in float vAlpha;
out vec4 outColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = vAlpha * (1.0 - smoothstep(0.6, 1.0, r));
  outColor = vec4(vec3(227.0, 236.0, 234.0) / 255.0 * a, a);
}
