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
    color: 0xdddddd,
  };
  static CIRCLE_OBJECT_PARAM = {
    ballRadius: 0.3,
    ballAmount: 30,
    circleRadius: 4.5,
    rotationAcceleration: 0.001,
    maxRotationSpeed: 0.1,
    shakeHeadInterval: 10.0,
  };

  renderer;
  scene;
  camera;
  startTime;
  ambientLight;
  rotationSpeed = 0;
  material;
  sphereGeometry;
  sphereArray;
  axesHelper;
  isKeyDown;
  isTouched;

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

    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.sphereGeometry = new THREE.SphereGeometry(
      ThreeApp.CIRCLE_OBJECT_PARAM.ballRadius,
    );
    this.speres = [];
    for (let i = 0; i < ThreeApp.CIRCLE_OBJECT_PARAM.ballAmount; ++i) {
      const sphere = new THREE.Mesh(this.sphereGeometry, this.material);
      const theta =
        Math.PI * 2.0 * (i / ThreeApp.CIRCLE_OBJECT_PARAM.ballAmount);
      const x = ThreeApp.CIRCLE_OBJECT_PARAM.circleRadius * Math.cos(theta);
      const y = ThreeApp.CIRCLE_OBJECT_PARAM.circleRadius * Math.sin(theta);
      sphere.position.x = x;
      sphere.position.y = y;
      sphere.position.z = 0;
      this.group.add(sphere);
    }

    // this のバインド
    this.render = this.render.bind(this);

    this.isTouched = false;
    this.isKeyDown = false;

    window.addEventListener(
      "keydown",
      (e) => {
        switch (e.key) {
          case " ":
            this.isKeyDown = true;
            break;
          default:
            break;
        }
      },
      false,
    );
    window.addEventListener(
      "keyup",
      (_) => {
        this.isKeyDown = false;
      },
      false,
    );

    window.addEventListener(
      "mousedown",
      (_) => {
        this.isTouched = true;
      },
      false,
    );
    window.addEventListener(
      "mouseup",
      (e) => {
        // e.preventDefault();
        this.isTouched = false;
      },
      false,
    );

    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false,
    );
    this.startTime = performance.now();
  }

  render() {
    requestAnimationFrame(this.render);

    this.rotationSpeed +=
      ThreeApp.CIRCLE_OBJECT_PARAM.rotationAcceleration *
      (this.isTouched || this.isKeyDown ? 1 : -1);

    this.rotationSpeed = Math.min(
      Math.max(this.rotationSpeed, 0.0),
      ThreeApp.CIRCLE_OBJECT_PARAM.maxRotationSpeed,
    );

    this.group.rotation.z += this.rotationSpeed;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000.0;
    const { shakeHeadInterval } = ThreeApp.CIRCLE_OBJECT_PARAM;
    this.group.rotation.y = Math.sin(
      Math.PI * 2 * (elapsed / shakeHeadInterval),
    );
    this.renderer.render(this.scene, this.camera);
  }
}
