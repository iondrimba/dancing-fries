import 'styles/index.css';

const radians = (degrees) => {
  return degrees * Math.PI / 180;
}

const map = (value, start1, stop1, start2, stop2) => {
  return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
}

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

export default class App {
  constructor() {
    this.tiles = [];
    this.cols = 2;
    this.rows = 2;

    this.angle = 0;
    this.amplitude = 0;
    this.frequency = 1;
    this.wavelength = 0;
    this.speed = 1000;

    this.init();

    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  init() {
    this.floorShape = this.createShape();
    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addDirectionalLight();
    this.addCameraControls();
    this.addCones(this.floorShape);
    this.addGround(this.floorShape);

    this.animate();
  }

  addDirectionalLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 0);
    light.castShadow = true;
    
    light.shadow.camera.far = 2000;
    light.shadow.camera.near = -50;

    light.shadow.camera.left = -20;
    light.shadow.camera.right = 20;  
    light.shadow.camera.top = 15;  
    light.shadow.camera.bottom = -15;  
    light.shadow.camera.zoom = 1;

    const targetObject = new THREE.Object3D();
    targetObject.position.set(-20, -5, -10);

    light.target = targetObject;

    this.scene.add(light);
    this.scene.add(light.target);

    var helper = new THREE.CameraHelper( light.shadow.camera );
    this.scene.add( helper );
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
    // this.controls.maxPolarAngle = radians(50);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight('#fed244', 1, 100);
    this.scene.add(light);
  }

  createShape() {
    const size = 50;
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
    const spacing = 2;
    const geometry = new THREE.CylinderGeometry(1, 1, 4, 64);
    const material = new THREE.MeshPhongMaterial({ color: '#fed244' });
    const finalPos = (i) => { return (-i * spacing); }

    this.groupCones = new THREE.Object3D();

    for (let i = 0; i < this.cols; i++) {
      this.tiles[i] = [];

      for (let j = 0; j < this.rows; j++) {
        const x = finalPos(i);
        const y = finalPos(j);

        this.createHole(shape, x, y);

        this.tiles[i][j] = this.createCone(geometry, material);
        this.tiles[i][j].position.set(x - (i * spacing), 0, y - (j * spacing));

        this.groupCones.add(this.tiles[i][j]);
      }
    }

    // this.groupCones.position.set(5, 0, 5);
    this.scene.add(this.groupCones);
  }

  createHole(shape, x, y) {
    const holePath = new THREE.Path();
    const radius = 1;

    holePath.moveTo(x, y);
    holePath.ellipse(x, y, radius, radius, 0, Math.PI * 2);
    holePath.autoClose = true;

    shape.holes.push(holePath);
  }

  addGround(shape) {
    const groundColor = '#fed244';
    const materials = [
      new THREE.MeshPhongMaterial({ color: groundColor }),
      new THREE.MeshPhongMaterial({
        color: groundColor,
        side: THREE.DoubleSide
      }),
    ];

    const props = {
      steps: 8,
      depth: 4,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, props);
    const mesh = new THREE.Mesh(geometry, materials);

    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    mesh.material.needsUpdate = true;

    // mesh.position.set(5, 0, 5);
    mesh.receiveShadow = true;

    this.scene.add(mesh);
  }

  createCone(geometry, material) {
    const obj = new THREE.Mesh(geometry, material);
    obj.position.y = 0;
    obj.receiveShadow = true;
    obj.castShadow = true;

    const pivot = new THREE.Object3D();
    pivot.add(obj);
    pivot.size = 0;

    return pivot;
  }

  drawWave() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const dist = distance(j, i, -this.rows, -this.cols);
        const offset = map(dist, -this.wavelength, 100, -140, this.wavelength);
        const angle = this.angle + offset;
        const y = map(Math.sin(angle), -1, 1, -4, this.amplitude);

        this.tiles[i][j].position.y = y;
      }
    }

    this.angle -= this.frequency / 20;
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.drawWave();
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