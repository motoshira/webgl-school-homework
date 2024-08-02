import * as THREE from "three";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const wrapper = document.querySelector("#webgl");
    const app = new ThreeApp(wrapper);
    app.render();
  },
  false,
);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

class InertialScrollManager {
  static SPEED_FACTOR = 0.5;
  static DIST_THRESHOLD = 0.01;
  targetX;
  x;
  lastTime;
  constructor(initX) {
    this.targetX = initX;
    this.x = initX;
  }
  update(newX, nextTime) {
    const elapsed = nextTime - this.lastTime;
    const speed = (newX - this.x) / elapsed;
    this.targetX += speed;
    const nextX =
      this.x + (this.targetX - this.x) * InertialScrollManager.SPEED_FACTOR;
    this.x =
      Math.abs(this.x - nextX) < InertialScrollManager.DIST_THRESHOLD
        ? this.x
        : nextX;
    this.lastTime = nextTime;
  }
}

class ThreeApp {
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 20.0,
    position: new THREE.Vector3(0.0, 2.0, 10.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  static RENDERER_PARAM = {
    clearColor: 0x666666,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
  };
  static MATERIAL_PARAM = {
    color: 0xaa0000,
  };
  static SLICE_PARAM = {
    width: 1.0,
    height: 2.0,
    amount: 1000,
    minX: -100.0,
    maxX: 100.0,
  };
  static INERTIAL_SCROLL_PARAMS = {
    speedFactor: 0.5,
    lowerLimit: 0.01,
  };

  renderer;
  scene;
  camera;
  startTime;
  ambientLight;

  planteGeometry;

  material;
  sphereGeometry;
  sphereArray;
  axesHelper;
  isKeyDown;
  isTouched;
  scrollX = 0.0;

  constructor(wrapper) {
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height,
    );
    wrapper.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera(-10.0, 10.0, 10.0, -10.0);

    /* this.camera = new THREE.PerspectiveCamera(
     *   ThreeApp.CAMERA_PARAM.fovy,
     *   ThreeApp.CAMERA_PARAM.aspect,
     *   ThreeApp.CAMERA_PARAM.near,
     *   ThreeApp.CAMERA_PARAM.far,
     * ); */
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

    /* this.group = new THREE.Group();
     * this.scene.add(this.group);
     */
    this.planteGeometry = new THREE.PlaneGeometry(
      ThreeApp.SLICE_PARAM.width,
      ThreeApp.SLICE_PARAM.height,
    );

    const texture = new THREE.TextureLoader().load("./(_˘ω˘).png");
    this.slices = [];
    for (let i = 0; i < ThreeApp.SLICE_PARAM.amount; ++i) {
      const material = new THREE.MeshBasicMaterial({
        // TODO add texture
        map: texture,
        // transparent: true,
      });
      const slice = new THREE.Mesh(this.planteGeometry, material);
      const { minX, maxX, amount } = ThreeApp.SLICE_PARAM;
      const x = minX + (maxX - minX) * (i / (amount - 1));
      // -2.0 〜 2.0
      const theta = clamp(-x, -1.0, 1.0) * 1.0 * 0.4 * Math.PI;
      // const theta = Math.PI / 4;
      slice.position.x = x;
      slice.position.y = 0;
      slice.position.z = 0;
      slice.rotation.set(0, theta, 0);
      this.scene.add(slice);
    }

    // this のバインド
    this.render = this.render.bind(this);

    this.isTouched = false;
    this.isKeyDown = false;

    window.addEventListener(
      "drag",
      (e) => {
        // TODO update inertial scroll manager
      },
      false,
    );
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
    this.startTime = performance.now();
  }

  render() {
    requestAnimationFrame(this.render);

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000.0;
    // const { shakeHeadInterval } = ThreeApp.CIRCLE_OBJECT_PARAM;
    /* this.group.rotation.y = Math.sin(
     *   Math.PI * 2 * (elapsed / shakeHeadInterval),
     * ); */
    // TODO update scrollX

    // TODO update x
    // TODO update all slices (position.x and rotation.y)

    this.renderer.render(this.scene, this.camera);
  }
}
