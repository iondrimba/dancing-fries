import 'styles/index.css';

const radians = (degrees) => {
  return degrees * Math.PI / 180;
}

const hexToRgbTreeJs = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

export default class App {
  constructor() {
    this.color = '#fed244';
    this.coneMaterials = [
      new THREE.MeshLambertMaterial({ color: this.color}),
      new THREE.MeshLambertMaterial({ color: this.color }),
      new THREE.MeshLambertMaterial({ color: this.color }),
    ];
    this.holesMaterials = [
      new THREE.MeshLambertMaterial({ color: this.color }),
      new THREE.MeshLambertMaterial({ color: this.color }),
    ];
    this.gui = new dat.GUI();
    this.gui.close();
    this.cols = 12;
    this.rows = 5;
    this.coneRadius = .6;
    this.coneHeight = 4;
    this.coneSpacing = 1.4;
    this.cones = [];
    this.flipped = false;

    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  init() {
     this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addDirectionalLight();
    this.addCameraControls();

    this.floorShape = this.createShape();
    this.addCones(this.floorShape);
    this.ground = this.addGround(this.floorShape);
    this.scene.add(this.ground);
    this.scene.add(this.groupCones);

    this.positionGrid();
    this.addGUIControls();
    this.animate();
    this.animateGrid();
  }

  addGUIControls() {
    const backgroundGUI = this.gui.addFolder('Color');
    backgroundGUI.addColor(this, 'color').onChange((color) => {
      document.body.style.backgroundColor = color;
      this.scene.background = new THREE.Color(color);
      this.ground.material[0].color = hexToRgbTreeJs(color);
      this.coneMaterials[0].color = hexToRgbTreeJs(color);
      this.coneMaterials[1].color = hexToRgbTreeJs(color);
      this.coneMaterials[2].color = hexToRgbTreeJs(color);

      this.holesMaterials[0].color = hexToRgbTreeJs(color);
      this.holesMaterials[1].color = hexToRgbTreeJs(color);
    });
  }

  positionGrid() {
    this.groupCones.position.set(-6, 0, 4);
    this.ground.position.set(-6, 0, 4);
    this.groupCones.rotation.y = radians(-90);
    this.ground.rotation.z = radians(90);
  }

  addDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, .3);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 1, 0);

    this.directionalLight.shadow.camera.far = 1000;
    this.directionalLight.shadow.camera.near = -100;

    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.directionalLight.shadow.camera.zoom = 1;
    this.directionalLight.shadow.camera.needsUpdate = true;

    const targetObject = new THREE.Object3D();
    targetObject.position.set(-50, -82, -24);
    this.directionalLight.target = targetObject;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    const lightGUI = this.gui.addFolder('Light');
    lightGUI.add(targetObject.position, 'x', -100, 100).onChange((x) => {
      targetObject.position.x = x ;
    });

    lightGUI.add(targetObject.position, 'y', -100, 100).onChange((y) => {
      targetObject.position.y = y ;
    });

    lightGUI.add(targetObject.position, 'z', -100, 100).onChange((z) => {
      targetObject.position.z = z ;
    });

    this.aa = new THREE.DirectionalLight(0x000000, .1, 1000);
    this.aa.position.set(20, 1, 0);
    this.scene.add(this.aa);
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    const fov = 25;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 1000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(-30, 30, 30);
    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = radians(50);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(this.color, 1, 1000);
    this.scene.add(light);
  }

  createShape() {
    const size = 100;
    const vectors = [
      new THREE.Vector2(-size, size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(size, -size),
      new THREE.Vector2(size, size)
    ];

    const shape = new THREE.Shape(vectors);
    shape.autoClose = true;

    return shape;
  }

  addCones(shape) {
    const geometry = new THREE.CylinderGeometry(this.coneRadius, this.coneRadius, this.coneHeight, 32);
    const finalPos = (i) => { return (-i * this.coneSpacing); }

    this.groupCones = new THREE.Object3D();

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const x = finalPos(i);
        const y = finalPos(j);

        this.createHole(shape, x, y);

        const cone = this.createCone(geometry, this.coneMaterials);
        cone.needsUpdate = true;
        cone.position.set(x - (i * this.coneSpacing), -(this.coneHeight * .5), y - (j * this.coneSpacing));

        this.cones.push(cone);
        this.groupCones.add(cone);
      }
    }
  }

  createHole(shape, x, y) {
    const holePath = new THREE.Path();
    const radius = this.coneRadius;

    holePath.moveTo(x, y);
    holePath.ellipse(x, y, radius, radius, 0, Math.PI * 2);
    holePath.autoClose = true;

    shape.holes.push(holePath);
  }

  addGround(shape) {
    const extrudeSettings = {
      curveSegments: 32,
      steps: 1,
      depth: 4,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, this.holesMaterials);

    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    mesh.material.needsUpdate = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  createCone(geometry, material) {
    return new THREE.Mesh(geometry, material);
  }

  flipCamera() {
    this.flipped = !this.flipped;

    if (this.flipped) {
      this.groupCones.position.set(-4, 0, 12);
      this.ground.position.set(-4, 0, 12);
      this.scene.rotation.x = radians(-180);
    } else {
      this.groupCones.position.set(-6, 0, 4);
      this.ground.position.set(-6, 0, 4);
      this.scene.rotation.x = radians(0);
    }

    this.camera.lookAt(this.scene.position);
  }

  animateIn(element, index, onComplete = () => { }) {
    TweenMax.to(element.position, .5, {
      y: (this.coneHeight * .5),
      ease: Expo.easeOut,
      delay: index * .03,
      onUpdate: () => { element.castShadow = true },
      onCompleteParams: [element, index],
      onComplete: (elm, i) => { onComplete(elm, i) }
    })
  }

  animateOut(element, index) {
    TweenMax.to(element.position, .8, {
      y: -(this.coneHeight * .5),
      ease: Elastic.easeOut.config(2, 2),
      onCompleteParams: [element, index],
      onComplete: (elm, i) => {
        elm.castShadow = false;

        if (i === this.cones.length - 1) {
          this.flipCamera();
          this.animateGrid();
        }
      }
    })
  }

  animateGrid() {
    for (let index = 0; index < this.cones.length; index++) {
      const element = this.cones[index];
      this.animateIn(element, index, this.animateOut.bind(this));
    }
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }
}