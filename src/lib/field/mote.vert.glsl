#version 300 es
in vec2 aPos;
in vec2 aSizeAlpha;
uniform vec2 uRes;
uniform float uPxScale;
out float vAlpha;
void main() {
  vec2 c = aPos / uRes * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  gl_PointSize = max(1.0, aSizeAlpha.x * uPxScale) + 1.0;
  vAlpha = aSizeAlpha.y;
}
