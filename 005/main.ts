// モジュールを読み込み
import { WebGLUtility } from "../lib/webgl.js";

// ドキュメントの読み込みが完了したら実行されるようイベントを設定する
window.addEventListener(
  "DOMContentLoaded",
  async () => {
    // アプリケーションのインスタンスを初期化し、必要なリソースをロードする
    const app = new App();
    app.init();
    await app.load();
    // ロードが終わったら各種セットアップを行う
    app.setupGeometry();
    app.setupLocation();
    // すべてのセットアップが完了したら描画を開始する @@@
    app.start();
  },
  false,
);

/**
 * アプリケーション管理クラス
 */
class App {
  canvas: HTMLCanvasElement; // WebGL で描画を行う canvas 要素
  gl: WebGLRenderingContext; // WebGLRenderingContext （WebGL コンテキスト）
  program: WebGLProgram; // WebGLProgram （プログラムオブジェクト）
  position: number[]; // 頂点の座標情報を格納する配列
  positionStride: number; // 頂点の座標のストライド
  positionVBO: WebGLBuffer; // 頂点座標の VBO
  color: number[]; // 頂点カラーの座標情報を格納する配列
  colorStride: number; // 頂点カラーの座標のストライド
  colorVBO: WebGLBuffer; // 頂点カラー座標の VBO
  uniformLocation: { time: WebGLUniformLocation | null }; // uniform 変数のロケーション @@@
  startTime: Date; // レンダリング開始時のタイムスタンプ @@@
  isRendering: boolean; // レンダリングを行うかどうかのフラグ @@@

  constructor() {
    // this を固定するためのバインド処理
    this.render = this.render.bind(this);
  }

  /**
   * 初期化処理を行う
   */
  init() {
    // canvas エレメントの取得と WebGL コンテキストの初期化
    this.canvas = document.getElementById("webgl-canvas") as HTMLCanvasElement;
    this.gl = WebGLUtility.createWebGLContext(this.canvas);

    // canvas のサイズを設定
    const size = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.width = size;
    this.canvas.height = size;
  }

  /**
   * 各種リソースのロードを行う
   * @return {Promise}
   */
  load() {
    return new Promise(async (resolve, reject) => {
      // 変数に WebGL コンテキストを代入しておく（コード記述の最適化）
      const gl = this.gl;
      // WebGL コンテキストがあるかどうか確認する
      if (gl == null) {
        // もし WebGL コンテキストがない場合はエラーとして Promise を reject する
        const error = new Error("not initialized");
        reject(error);
      } else {
        // まずシェーダのソースコードを読み込む
        const VSSource = await WebGLUtility.loadFile("./main.vert");
        const FSSource = await WebGLUtility.loadFile("./main.frag");
        // 無事に読み込めたらシェーダオブジェクトの実体を生成する
        const vertexShader = WebGLUtility.createShaderObject(
          gl,
          VSSource,
          gl.VERTEX_SHADER,
        );
        const fragmentShader = WebGLUtility.createShaderObject(
          gl,
          FSSource,
          gl.FRAGMENT_SHADER,
        );
        // プログラムオブジェクトを生成する
        this.program = WebGLUtility.createProgramObject(
          gl,
          vertexShader,
          fragmentShader,
        );
        resolve();
      }
    });
  }

  /**
   * 頂点属性（頂点ジオメトリ）のセットアップを行う
   */
  setupGeometry() {
    // ほぼ円になるように、細長い三角形を大量に描画する
    // 頂点座標の定義
    // (x, y, z) をフラットに入れる
    this.position = [];
    // 頂点の色の定義
    // (r, g, b, a) をフラットに入れる
    this.color = [];
    for (let i = 0; i < 999; i++) {
      const ta = (i * 2 * Math.PI) / 999;
      const tb = ((i + 1) * 2 * Math.PI) / 999;
      const xa = Math.cos(ta);
      const ya = Math.sin(ta);
      // 青から赤にグラデーションになるようにする
      const ga = (Math.cos(ta) + 1) / 2;
      const ba = (-Math.cos(ta) + 1) / 2;
      const xb = Math.cos(tb);
      const yb = Math.sin(tb);
      const gb = (Math.cos(tb) + 1) / 2;
      const bb = (-Math.cos(tb) + 1) / 2;
      // 1つ目の点
      for (const w of [xa, ya, 0]) {
        this.position.push(w);
      }
      for (const c of [0, ga, ba, 1.0]) {
        this.color.push(c);
      }
      // 2つ目の点
      for (const w of [xb, yb, 0]) {
        this.position.push(w);
      }
      for (const c of [0, gb, bb, 1.0]) {
        this.color.push(c);
      }
      // 原点
      for (const w of [0, 0, 0]) {
        this.position.push(w);
      }
      for (const c of [1.0, 1.0, 1.0, 1.0]) {
        this.color.push(c);
      }
    }
    // 要素数は XYZ の３つ
    this.positionStride = 3;
    // VBO を生成
    this.positionVBO = WebGLUtility.createVBO(this.gl, this.position);
    // 要素数は RGBA の４つ
    this.colorStride = 4;
    // VBO を生成
    this.colorVBO = WebGLUtility.createVBO(this.gl, this.color);
  }

  /**
   * 頂点属性のロケーションに関するセットアップを行う
   */
  setupLocation() {
    const gl = this.gl;
    // attribute location の取得
    const positionAttributeLocation = gl.getAttribLocation(
      this.program,
      "position",
    );
    const colorAttributeLocation = gl.getAttribLocation(this.program, "color");
    // WebGLUtility.enableBuffer は引数を配列で取る仕様なので、いったん配列に入れる
    const vboArray = [this.positionVBO, this.colorVBO];
    const attributeLocationArray = [
      positionAttributeLocation,
      colorAttributeLocation,
    ];
    const strideArray = [this.positionStride, this.colorStride];
    // 頂点情報の有効化
    WebGLUtility.enableBuffer(
      gl,
      vboArray,
      attributeLocationArray,
      strideArray,
    );

    // uniform location の取得 @@@
    this.uniformLocation = {
      time: gl.getUniformLocation(this.program, "time"),
    };
  }

  /**
   * レンダリングのためのセットアップを行う
   */
  setupRendering() {
    const gl = this.gl;
    // ビューポートを設定する
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // クリアする色を設定する（RGBA で 0.0 ～ 1.0 の範囲で指定する）
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    // 実際にクリアする（gl.COLOR_BUFFER_BIT で色をクリアしろ、という指定になる）
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * 描画を開始する @@@
   */
  start() {
    // レンダリング開始時のタイムスタンプを取得しておく @@@
    this.startTime = Date.now();

    // レンダリングを行っているフラグを立てておく @@@
    this.isRendering = true;

    // レンダリングの開始
    this.render();
  }

  /**
   * 描画を停止する @@@
   */
  stop() {
    this.isRendering = false;
  }

  /**
   * レンダリングを行う
   */
  render() {
    const gl = this.gl;

    // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める @@@
    if (this.isRendering === true) {
      requestAnimationFrame(this.render);
    }

    this.setupRendering();
    const nowTime = (Date.now() - this.startTime) * 0.001;
    gl.useProgram(this.program);
    gl.uniform1f(this.uniformLocation.time, nowTime);
    gl.drawArrays(gl.TRIANGLES, 0, this.position.length / this.positionStride);
  }
}
