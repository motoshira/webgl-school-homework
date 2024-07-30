
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
varying vec4 vColor;
varying vec3 vNormal;

void main() {
  // 法線
	vNormal = normalize((normalMatrix * vec4(normal, 0.0)).xyz);
	// カラーはそのまま渡す (線形補完される)
	vColor = color;
  // MVP 行列と頂点座標を乗算してから出力する
  gl_Position = mvpMatrix * vec4(position, 1.0);
}
