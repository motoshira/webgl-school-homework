import * as THREE from "three";

window.addEventListener(
  "DOMContentLoaded",
  async () => {
    const wrapper = document.querySelector("#webgl");
    const app = new ThreeApp();
    await app.init(wrapper);
    app.render();
  },
  false,
);

const loadTexture = (path) => {
  return new Promise((resolve) => {
    // 地球用画像の読み込みとテクスチャ生成 @@@
    const loader = new THREE.TextureLoader();
    loader.load(path, resolve);
  });
}


// TODO 画面右下のミニマップを描画する
class MiniMapRenderer {}

// TODO 3D空間を描画する
class WorldRenderer {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.01,
    far: 20.0,
    distance: 0.9,
    position: new THREE.Vector3(0.0, 0.0, 1.2),
    // position: new THREE.Vector3(1.2,0, 0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 2.0,
    position: new THREE.Vector3(0.0, 0.2, 1.0),
    targetPosition: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x222222,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.3,
  };

  // from ctor props
  renderer;
  renderTarget;
  clearColor;
  earth;
  cone;
  coneDirection;
  clock;

  // private
  scene;
  camera;
  cameraDirection;

  directionalLight;
  ambientLight;

  constructor({renderer, renderTarget, earth, cone, coneDirection, clock}) {
    this.renderer = renderer;
    this.renderTarget = renderTarget
    this.earth = earth;
    this.cone = cone;
    this.coneDirection = coneDirection;
    this.clock = clock;
  }

  async init() {
    this.scene = new THREE.Scene();
    this.clearColor = new THREE.Color(WorldRenderer.RENDERER_PARAM.clearColor);

    this.camera = new THREE.PerspectiveCamera(
      WorldRenderer.CAMERA_PARAM.fovy,
      WorldRenderer.CAMERA_PARAM.aspect,
      WorldRenderer.CAMERA_PARAM.near,
      WorldRenderer.CAMERA_PARAM.far,
    );
    this.camera.position.copy(WorldRenderer.CAMERA_PARAM.position);
    this.cameraDirection = new THREE.Vector3().copy(WorldRenderer.CAMERA_PARAM.lookAt);

    this.directionalLight = new THREE.DirectionalLight(
      WorldRenderer.DIRECTIONAL_LIGHT_PARAM.color,
      WorldRenderer.DIRECTIONAL_LIGHT_PARAM.intensity,
    );
    this.directionalLight.position.copy(WorldRenderer.DIRECTIONAL_LIGHT_PARAM.position);
    this.directionalLight.target.position.copy(WorldRenderer.DIRECTIONAL_LIGHT_PARAM.targetPosition);
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(
      WorldRenderer.AMBIENT_LIGHT_PARAM.color,
      WorldRenderer.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    this.scene.add(this.earth);
    this.scene.add(this.cone);

    this.cameraDirection.subVectors(this.cone.position, this.camera.position);
    this.camera.lookAt(this.cone.position);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }

  updateCameraPositionAndRotation() {
    const elapsed = this.clock.getElapsedTime();
    const theta = elapsed * ThreeApp.CONE_PARAM.speed + 0.3;
    const newX = 0.1;
    const newY = Math.cos(theta) * WorldRenderer.CAMERA_PARAM.distance;
    const newZ = Math.sin(theta) * WorldRenderer.CAMERA_PARAM.distance;
    this.camera.position.set(newX, newY, newZ);
    // upを更新していないので反転するが、この更新を入れるとガタガタしてしまう
    // this.camera.up.subVectors(this.camera.position, this.cone.position);
    this.camera.lookAt(this.cone.position);
  }
  render() {
    this.renderer.setClearColor(this.clearColor);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateCameraPositionAndRotation();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}

// TODO オフスクリーンレンダリングした結果をそれぞれビルボードに描画する
class ThreeApp {
  // Ohrhographic
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
  };
  static RENDERER_PARAM = {
    clearColor: 0xffffff,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static EARTH_PARAM = {
    radius: 0.5,
    widthSegments: 32,
    heightSegments: 32,
  }
  static CONE_PARAM = {
    color: 0xffffff,
    height: 0.01,
    radius: 0.003,
    // init position/rotation
    position: new THREE.Vector3(0, 0.0, 0.55),
    rotation: new THREE.Vector3(0, 0, 0),
    speed: 0.3,
    // turnScale: 0.0015,
    distance: 0.55,
  };


  renderer;
  clearColor;
  scene;

  // objects
  camera;
  worldPlane;
  minimapPlane;

  earth;
  cone;
  coneDirecion;

  // lighting
  ambientLight;

  // helper
  clock;

  // offscreen
  worldRenderer;
  worldRenderTarget;

  async init(wrapper) {
    this.clock = new THREE.Clock({autoStart: true})
    this.clearColor = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height,
    );
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // earth
    const sphereGeometry = new THREE.SphereGeometry(ThreeApp.EARTH_PARAM.radius, ThreeApp.EARTH_PARAM.widthSegments, ThreeApp.EARTH_PARAM.heightSegments)
    const earthTexture = await loadTexture("./earth.jpg");
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    earthMaterial.map = earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);

    // cone
    const { height: coneHeight, radius } = ThreeApp.CONE_PARAM;
    const geometry = new THREE.ConeGeometry( radius, coneHeight, 32 );
    const material = new THREE.MeshLambertMaterial( {color: ThreeApp.CONE_PARAM.color} );
    const cone = new THREE.Mesh(geometry, material);
    cone.position.copy(ThreeApp.CONE_PARAM.position);
    this.cone = cone;

    this.coneDirection = new THREE.Vector3(1.0, 0.0, 0.0);

    this.worldRenderTarget = new THREE.WebGLRenderTarget(width, height);
    this.worldRenderer = new WorldRenderer({
      renderer: this.renderer,
      renderTarget: this.worldRenderTarget,
      earth: this.earth,
      cone: this.cone,
      coneDirection: this.coneDirection,
      clock: this.clock,
    })

    await this.worldRenderer.init();

    this.camera = new THREE.OrthographicCamera(
      - width / 2,
      width / 2,
      height / 2,
      - height / 2,
      0.01,
      1000,
    );
    this.camera.position.set(0.0, 0.0, 10.0);
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    const directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity,
    );
    directionalLight.position.set(0.0, 0.0, 1.0);
    directionalLight.target.position.set(0.0, 0.0, 0.0);
    this.scene.add(directionalLight);

    // world
    const worldPlaneGeometry = new THREE.PlaneGeometry(
      width,
      height,
    )
    this.worldPlane = new THREE.Mesh(
      worldPlaneGeometry,
      new THREE.MeshStandardMaterial({
        map: this.worldRenderTarget.texture,
        side: THREE.DoubleSide,
      }),
    );
    this.worldPlane.position.set(0.0, 0.0, 0.0);
    // this.worldPlane.rotation.x = - Math.PI / 2;
    this.scene.add(this.worldPlane);

    // minimap
    const mapWidth = height / 2
    const _minimapPlaneGeometry = new THREE.PlaneGeometry(
      mapWidth,
      mapWidth,
    )
    this.minimapPlane = new THREE.Mesh(
      _minimapPlaneGeometry,
      new THREE.MeshStandardMaterial({color: 0xff00ff}),
    );
    this.minimapPlane.position.set(width / 2 - mapWidth / 2, -(height / 2 - mapWidth / 2), 1.0);
    this.scene.add(this.minimapPlane);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = - window.innerWidth / 2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / 2;
        this.camera.bottom = - window.innerHeight / 2;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }

  updateConePositionAndRotation() {
    const elapsed = this.clock.getElapsedTime();

    const currentPosition = this.cone.position.clone();
    const theta = elapsed * ThreeApp.CONE_PARAM.speed;
    const newX = 0.0;
    const newY = Math.cos(theta) * ThreeApp.CONE_PARAM.distance;
    const newZ = Math.sin(theta) * ThreeApp.CONE_PARAM.distance;
    this.cone.position.set(newX, newY, newZ);

    this.coneDirection.subVectors(this.cone.position, currentPosition);

    // upを更新しないと z < 0 のときに反転してしまう？
    this.cone.up.subVectors(this.cone.position, this.earth.position);
    // 同じ向き
    this.cone.lookAt(this.coneDirection);
  }

  render() {
    this.updateConePositionAndRotation();
    this.worldRenderer.render();
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(this.clearColor);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}
