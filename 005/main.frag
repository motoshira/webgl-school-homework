precision mediump float;
uniform float time;

varying vec4 vColor;

void main() {
  vec3 col = vColor.rgb * (sin(time * 2.0) + 1.0) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}
