import * as THREE from "three";
import earthImg from "./earth.jpg"

// test

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
class MiniMapRenderer {
  static CAMERA_PARAM = {
    near: 0.01,
    far: 1000.0,
    distance: 0.8,
    position: new THREE.Vector3(0.0, 0.0, 1.2),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x222222,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 2.0,
  };

  // from ctor props
  renderer;
  renderTarget;
  clearColor;
  coneDirection;
  clock;

  // private
  scene;
  camera;
  cameraDirection;
  width;

  earth;
  cone;

  ambientLight;

  constructor({renderer, renderTarget, coneDirection, clock}) {
    this.renderer = renderer;
    this.renderTarget = renderTarget
    this.coneDirection = coneDirection;
    this.clock = clock;
    this.width = Math.min(window.innerWidth / 2, window.innerHeight / 2);
  }

  async init() {
    this.scene = new THREE.Scene();
    this.clearColor = new THREE.Color(MiniMapRenderer.RENDERER_PARAM.clearColor);


    this.camera = new THREE.OrthographicCamera(
      -0.02, 0.02, 0.02, -0.02,
      MiniMapRenderer.CAMERA_PARAM.near,
      MiniMapRenderer.CAMERA_PARAM.far,
    );

    this.camera.position.copy(MiniMapRenderer.CAMERA_PARAM.position);
    this.cameraDirection = new THREE.Vector3().copy(MiniMapRenderer.CAMERA_PARAM.lookAt);

    this.ambientLight = new THREE.AmbientLight(
      MiniMapRenderer.AMBIENT_LIGHT_PARAM.color,
      MiniMapRenderer.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // earth
    const sphereGeometry = new THREE.SphereGeometry(ThreeApp.EARTH_PARAM.radius, ThreeApp.EARTH_PARAM.widthSegments, ThreeApp.EARTH_PARAM.heightSegments)
    const earthTexture = await loadTexture(earthImg);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    earthMaterial.map = earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    this.scene.add(this.earth);

    // cone
    const { height: coneHeight, radius } = ThreeApp.CONE_PARAM;
    const geometry = new THREE.ConeGeometry( radius, coneHeight, 32 );
    const material = new THREE.MeshLambertMaterial( {color: ThreeApp.CONE_PARAM.color} );
    const cone = new THREE.Mesh(geometry, material);
    cone.rotation.x = Math.PI * 0.5;
    const group = new THREE.Group();
    group.add(cone);
    group.position.copy(ThreeApp.CONE_PARAM.position);
    this.cone = group;
    this.scene.add(group);

    this.cameraDirection.subVectors(this.cone.position, this.camera.position);
    this.camera.lookAt(this.cone.position);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.width = Math.min(window.innerWidth / 2, window.innerHeight / 2);
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }

  updateCameraPositionAndRotation() {
    const elapsed = this.clock.getElapsedTime();
    const theta = elapsed * ThreeApp.CONE_PARAM.speed;
    const newX = 0.1;
    const newY = Math.cos(theta) * MiniMapRenderer.CAMERA_PARAM.distance;
    const newZ = Math.sin(theta) * MiniMapRenderer.CAMERA_PARAM.distance;
    this.camera.position.set(newX, newY, newZ);
    // 進行方向が画面の上向きになるようにする
    const up = new THREE.Vector3().subVectors(this.camera.position, this.cone.position).normalize().negate();
    this.camera.lookAt(this.cone.position);
    this.camera.up.copy(up);
  }
  render() {
    this.renderer.setClearColor(this.clearColor);
    this.updateCameraPositionAndRotation();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.setSize(this.width, this.width);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}

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
    intensity: 0.5,
  };

  // from ctor props
  renderer;
  renderTarget;
  clearColor;
  coneDirection;
  clock;

  // private
  scene;
  camera;
  cameraDirection;

  earth;
  cone;

  directionalLight;
  ambientLight;

  constructor({renderer, renderTarget, coneDirection, clock}) {
    this.renderer = renderer;
    this.renderTarget = renderTarget
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

    // earth
    const sphereGeometry = new THREE.SphereGeometry(ThreeApp.EARTH_PARAM.radius, ThreeApp.EARTH_PARAM.widthSegments, ThreeApp.EARTH_PARAM.heightSegments)
    const earthTexture = await loadTexture(earthImg);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    earthMaterial.map = earthTexture;
    this.earth = new THREE.Mesh(sphereGeometry, earthMaterial);
    this.scene.add(this.earth);

    // cone
    const { height: coneHeight, radius } = ThreeApp.CONE_PARAM;
    const geometry = new THREE.ConeGeometry( radius, coneHeight, 32 );
    const material = new THREE.MeshLambertMaterial( {color: ThreeApp.CONE_PARAM.color} );
    const cone = new THREE.Mesh(geometry, material);
    cone.rotation.x = Math.PI * 0.5;
    const group = new THREE.Group();
    group.add(cone);
    group.position.copy(ThreeApp.CONE_PARAM.position);
    this.cone = group;
    this.scene.add(group);

    this.cameraDirection.subVectors(this.cone.position, this.camera.position);
    this.camera.lookAt(this.cone.position);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
  }

  updateCameraPositionAndRotation() {
    const elapsed = this.clock.getElapsedTime();
    const theta = elapsed * ThreeApp.CONE_PARAM.speed + 0.1 * Math.PI;
    const newX = 0.1;
    const newY = Math.cos(theta) * WorldRenderer.CAMERA_PARAM.distance;
    const newZ = Math.sin(theta) * WorldRenderer.CAMERA_PARAM.distance;
    this.camera.position.set(newX, newY, newZ);
    // upを更新していないので反転するが、この更新を入れるとガタガタしてしまう
    const up = new THREE.Vector3().subVectors(this.camera.position, this.cone.position).normalize();
    this.camera.lookAt(this.cone.position);
    this.camera.up.copy(up);
  }
  render() {
    this.renderer.setClearColor(this.clearColor);
    this.updateCameraPositionAndRotation();
    this.renderer.setRenderTarget(this.renderTarget);
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
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
  minimapBorderPlane;

  coneDirection;

  // lighting
  ambientLight;

  // helper
  clock;

  // offscreen
  worldRenderer;
  worldRenderTarget;

  miniMapRenderer
  miniMapRenderTarget;


  async init(wrapper) {
    this.clock = new THREE.Clock({autoStart: true})
    this.clearColor = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const mapWidth = Math.min(width / 2, height / 2)

    this.coneDirection = new THREE.Vector3(1.0, 0.0, 0.0);

    this.worldRenderTarget = new THREE.WebGLRenderTarget(width, height);
    this.worldRenderer = new WorldRenderer({
      renderer: this.renderer,
      renderTarget: this.worldRenderTarget,
      coneDirection: this.coneDirection,
      clock: this.clock,
    })

    await this.worldRenderer.init();

    this.miniMapRenderTarget = new THREE.WebGLRenderTarget(mapWidth, mapWidth);
    this.miniMapRenderer = new MiniMapRenderer({
      renderer: this.renderer,
      renderTarget: this.miniMapRenderTarget,
      coneDirection: this.coneDirection,
      clock: this.clock,
    })

    await this.miniMapRenderer.init();

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
    this.scene.add(this.worldPlane);

    // minimap
    const _minimapPlaneGeometry = new THREE.PlaneGeometry(
      mapWidth,
      mapWidth,
    )
    this.minimapPlane = new THREE.Mesh(
      _minimapPlaneGeometry,
      new THREE.MeshStandardMaterial({
        map: this.miniMapRenderTarget.texture,
        side: THREE.DoubleSide,
      }),
    );
    this.minimapPlane.position.set(width / 2 - mapWidth / 2, -(height / 2 - mapWidth / 2), 1.0);
    this.scene.add(this.minimapPlane);

    const borderWidth = 2;

        const _minimapBorderPlaneGeometry = new THREE.PlaneGeometry(
          mapWidth + 2,
          mapWidth + 2,
        )
    this.minimapBorderPlane = new THREE.Mesh(
      _minimapBorderPlaneGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      }),
    );
    this.minimapBorderPlane.position.set(width / 2 - mapWidth / 2 - borderWidth  / 2, -(height / 2 - mapWidth / 2 - borderWidth  / 2), 0.9);
    this.scene.add(this.minimapBorderPlane);

    // this のバインド
    this.render = this.render.bind(this);

    window.addEventListener(
      "resize",
      () => {
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

    for (const renderer of [this.worldRenderer, this.miniMapRenderer]) {
      const {cone, earth} = renderer;
      const currentPosition = cone.position.clone();
      const theta = elapsed * ThreeApp.CONE_PARAM.speed;
      const newX = 0.0;
      const newY = Math.cos(theta) * ThreeApp.CONE_PARAM.distance;
      const newZ = Math.sin(theta) * ThreeApp.CONE_PARAM.distance;

      cone.position.set(newX, newY, newZ);
      this.coneDirection.subVectors(cone.position, currentPosition);
      this.coneDirection.normalize();
      // coneの向き先
      const lookAtPoint = cone.position.clone().add(this.coneDirection);
      const upVector = cone.position.clone().normalize();

      cone.lookAt(lookAtPoint);
      cone.up.copy(upVector);
    }
  }

  render() {
    this.updateConePositionAndRotation();
    this.worldRenderer.render();
    this.miniMapRenderer.render();

    this.renderer.setClearColor(this.clearColor);
    this.renderer.setRenderTarget(null);
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height,
    );
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}
