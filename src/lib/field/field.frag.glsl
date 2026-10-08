#version 300 es
// The Descent field: Black Lodge base, growing dark volumes, top-left bloom, offscreen-light shafts
// (screen blend), and the presence occlusion. All geometry in CSS px, y down, viewport space.
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform float uPxScale;
uniform vec3 uBase;
uniform float uBloom;
uniform vec4 uVolA[3];
uniform vec4 uVolC[3];
uniform float uVolStop[3];
uniform int uShaftCount;
uniform vec4 uShaftA[5];
uniform vec4 uShaftB[5];
uniform float uBreath;
uniform vec3 uPresence;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uPxScale - gl_FragCoord.y) / uPxScale;
  vec3 col = uBase;

  for (int i = 0; i < 3; i++) {
    float r = length((p - uVolA[i].xy) / uVolA[i].zw);
    col = mix(col, uVolC[i].rgb, uVolC[i].a * (1.0 - clamp(r / uVolStop[i], 0.0, 1.0)));
  }

  vec2 bc = vec2(-0.12 * uRes.x, -120.0);
  float br = length((p - bc) / vec2(0.4524 * uRes.x, 572.0));
  float ba = br < 0.45 ? mix(0.15, 0.04, br / 0.45) : mix(0.04, 0.0, clamp((br - 0.45) / 0.27, 0.0, 1.0));
  col = mix(col, vec3(160.0, 196.0, 192.0) / 255.0, ba * uBloom);

  vec2 pc = vec2(uPresence.x, 0.5 * uRes.y);
  float occ = 1.0 - smoothstep(0.0, 1.0, length(p - pc) / uPresence.y);

  for (int i = 0; i < 5; i++) {
    if (i >= uShaftCount) break;
    vec2 apex = uShaftA[i].xy; float ang = uShaftA[i].z; float len = uShaftA[i].w;
    vec2 dir = vec2(-sin(ang), cos(ang));
    vec2 v = p - apex;
    float along = dot(v, dir);
    float t = (along - uShaftB[i].w) / len;
    if (t < 0.0 || t > 1.0) continue;
    float theta = abs(atan(dot(v, vec2(dir.y, -dir.x)), along));
    float m = 1.0 - clamp((theta - uShaftB[i].y) / (uShaftB[i].z - uShaftB[i].y), 0.0, 1.0);
    float g = t < 0.38 ? mix(1.0, 0.5, t / 0.38) : mix(0.5, 0.0, (t - 0.38) / 0.62);
    vec2 mid = apex + dir * (uShaftB[i].w + 0.5 * len);
    float dim = 1.0 - 5.0 * uPresence.z * (1.0 - smoothstep(0.0, 1.0, length(mid - pc) / uPresence.y));
    vec3 c = vec3(178.0, 208.0, 204.0) / 255.0 * (uShaftB[i].x * uBreath * m * g * dim);
    col = 1.0 - (1.0 - col) * (1.0 - c);
  }

  col *= 1.0 - uPresence.z * occ;
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither: no banding in the deep field
  outColor = vec4(col, 1.0);
}
