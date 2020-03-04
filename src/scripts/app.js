import 'styles/index.css';

import {
  radians,
} from './helpers';

export default class App {
  constructor() {
    this.groundColor = '#fed244';
    this.coneColor = '#fed244';
    this.spotLightColor = '#fed244';
    this.ambientLightColor = '#fed244';
    this.innerTubeColor = '#fed244';
    this.ground = {};
    this.groupCones = new THREE.Object3D();
    this.tiles = [];
    this.radius = 1;
    this.angle = 0;
    this.gridSize = 2;
    this.cols = this.gridSize
    this.rows = this.gridSize;
    this.gui = new dat.GUI();

    this.amplitude = 0;
    this.frequency = 2;
    this.wavelength = 0;
    this.speed = 6000;
    this.position = 10;

    this.init();

    const wave = this.gui.addFolder('Wave');
    wave.add(this, 'amplitude', -4, 4).onChange((amplitude) => {
      this.amplitude = amplitude;
    });

    wave.add(this, 'wavelength', -200, 200).onChange((wavelength) => {
      this.wavelength = wavelength;
    });

    wave.add(this, 'frequency', 0, 20).onChange((frequency) => {
      this.frequency = frequency;
    });
    
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  drawWave() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const distance = this.distance(j, i, -this.rows, -this.cols);
        const offset = this.map(distance, -this.wavelength, 100, -140, this.wavelength);
        const angle = this.angle + offset;
        const y = this.map(Math.sin(angle), -1, 1, -4, this.amplitude);

        this.tiles[i][j].position.y = y;
      }
    }


    this.angle -= this.frequency / 20;
  }

  addPointLight(params) {
    const pointLight = new THREE.PointLight(params.color, params.intensity);
    pointLight.position.set(params.position.x, params.position.y, params.position.z);

    this.scene.add(pointLight);
  }

  init() {
    this.createScene();
    this.createCamera();
    this.addAmbientLight(this.ambientLightColor);
    // this.addSpotLight(new THREE.SpotLight(this.spotLightColor), 600, 1000, -600);
    this.addCameraControls();

    this.floorShape = this.createShape();
    this.ground = this.createGround(this.floorShape);
 
    this.spheres = []

    this.pointLightObj = {
      color: '#fed244',
      intensity: 4,
      position: {
        x: 0,
        y: 29,
        z: 29,
      }
    };

    // this.addPointLight(this.pointLightObj);

    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);

    var light = new THREE.DirectionalLight( 0xffffff, 1, 10);
    light.position.set( 10, 10, 0 ); 			//default; light shining from top
    light.castShadow = true;            // default false
    this.scene .add( light );
    
    //Set up shadow properties for the light
    // light.shadow.mapSize.width = 512;  // default
    // light.shadow.mapSize.height = 512; // default
    // light.shadow.camera.near = 1;    // default
    // light.shadow.camera.far = 500;     // default
    var targetObject = new THREE.Object3D();
    targetObject.position.set( 1, 0, 2 ); 	
    this.scene.add(targetObject);

    light.target = targetObject;
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(30, 30, -30);
    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.maxPolarAngle = radians(50);
  }

  addSpotLight(spotLight, x, y, z) {
    this.spotLight = spotLight;
    this.spotLight.position.set(x, y, z);
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
  }

  addAmbientLight(color) {
    const light = new THREE.AmbientLight(color, 1);
    this.scene.add(light);
  }

  createShape() {
    const size = 10;
    const vectors = [
      new THREE.Vector2(-size, size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(size, -size),
      new THREE.Vector2(size, size)
    ];

    const shape = new THREE.Shape(vectors);
    shape.autoClose = true;

    const geometryCone = new THREE.CylinderGeometry(1, 1, 4, 59);

    this.materialCone = new THREE.MeshPhongMaterial({
      color: this.coneColor,
    });

    this.createHoles(shape, {
      geometry: geometryCone,
      material: this.materialCone
    });


    this.scene.add(this.groupCones);

    return shape;
  }

  createHoles(shape, props) {
    const finalPos = (i) => {
      return (-i * 1.5);
    }

    for (let i = 0; i < this.cols; i++) {
      this.tiles[i] = [];

      for (let j = 0; j < this.rows; j++) {
        const holePath = new THREE.Path();
        const x = finalPos(i);
        const y = finalPos(j);

        holePath.moveTo(x, y);
        holePath.ellipse(x, y, this.radius, this.radius, 0, Math.PI * 2);
        holePath.autoClose = true;
        shape.holes.push(holePath);

        this.tiles[i][j] = this.createCone(props.geometry, props.material);
        this.tiles[i][j].position.set(x - (i * 1.5), 0, y - (j * 1.5));

        this.groupCones.add(this.tiles[i][j]);
      }
    }

    this.groupCones.position.set(5, 0, 5);
  }

  createGround(shape) {
    var materials = [
      new THREE.MeshPhongMaterial({
        color: this.groundColor,
      }),
      new THREE.MeshPhongMaterial({
        color: this.groundColor,
        side: THREE.DoubleSide
      }),
    ];

    const props = {
      steps: 32,
      depth: 1,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(
      shape,
      props
    );

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    mesh.material.needsUpdate= true;

    mesh.position.set(5, 0, 5);
    mesh.receiveShadow = true;

    this.scene.add(mesh);

    return mesh;
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
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

  animate() {
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    this.drawWave();

    requestAnimationFrame(this.animate.bind(this));
  }

  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }
}