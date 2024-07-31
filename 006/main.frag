precision mediump float;

varying vec4 vColor;
varying vec3 vNormal;

const vec3 light = normalize(vec3(1.0, 1.0, 1.0));

void main() {
	// 変換した法線とライトベクトルで内積を取る
  float d = dot(vNormal, light);
  // 内積の結果を頂点カラーの RGB 成分に乗算する
  gl_FragColor = vec4(vColor.rgb * d, vColor.a);
}
