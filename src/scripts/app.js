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
    this.cols = 6;
    this.rows = 4;
    this.coneRadius = .6;
    this.coneHeight = 3.6;
    this.coneSpacing = 1.8;
    this.cones = [];

    this.angle = 0;
    this.amplitude = 0;
    this.frequency = 1;
    this.wavelength = 0;
    this.speed = 1000;
    this.flipped = false;
    this.init();

    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  init() {
    this.floorShape = this.createShape();
    this.secondfloorShape = this.createShape();

    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addDirectionalLight();
    this.addCameraControls();
    this.addCones(this.floorShape);
    this.ground = this.addGround(this.floorShape);
    this.scene.add(this.ground);

    this.groupCones.position.set(-5, 0, 5);    
    this.ground.position.set(-5, 0, 5);
    this.groupCones.rotation.y = radians(-90);
    this.ground.rotation.z = radians(90);
    
    this.animate();

    this.animateGrid();
  }

  addDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 1, 0);

    this.directionalLight.shadow.camera.far = 1000;
    this.directionalLight.shadow.camera.near = -100;

    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.directionalLight.shadow.camera.zoom = 1;

    const targetObject = new THREE.Object3D();
    targetObject.position.set(-20, -5, -10);
    this.directionalLight.target = targetObject;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);

    // var helper = new THREE.CameraHelper(this.directionalLight.shadow.camera);
    // this.scene.add(helper);
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

  flipCamera() {
    this.flipped = !this.flipped;

    if (this.flipped) {
      this.scene.rotation.x = radians(-180);
      this.camera.lookAt(this.scene.position);
      this.directionalLight.target.position.set(10, -5, 20);
    } else {
      this.directionalLight.target.position.set(-20, -5, -10);
      this.scene.rotation.x = radians(0);
      this.camera.lookAt(this.scene.position);
    }
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.maxPolarAngle = radians(50);
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight('#fed244', 1, 1000);
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
    const geometry = new THREE.CylinderGeometry(this.coneRadius, this.coneRadius, this.coneHeight, 32);
    const material = new THREE.MeshLambertMaterial({ color: '#fed244' });
    const finalPos = (i) => { return (-i * this.coneSpacing); }

    this.groupCones = new THREE.Object3D();

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const x = finalPos(i);
        const y = finalPos(j);

        this.createHole(shape, x, y);

        const cone = this.createCone(geometry, material);
        cone.position.set(x - (i * this.coneSpacing), -(this.coneHeight * .5), y - (j * this.coneSpacing));

        this.cones.push(cone);
        this.groupCones.add(cone);
      }
    }

    this.scene.add(this.groupCones);
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
    const groundColor = '#fed244';
    const materials = [
      new THREE.MeshLambertMaterial({ color: groundColor }),
      new THREE.MeshLambertMaterial({ color: groundColor }),
    ];

    const extrudeSettings = {
      curveSegments: 32,
      steps: 1,
      depth: 4,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, materials);

    mesh.rotation.set(Math.PI * 0.5, 0, 0);
    mesh.material.needsUpdate = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  createCone(geometry, material) {
    const obj = new THREE.Mesh(geometry, material);
    obj.position.y = 0;

    return obj;
  }

  animateIn(element, index, onComplete = () => {}) {
    TweenMax.to(element.position, .3, {
      y: (this.coneHeight * .5),
      ease: Sine.easeOut,
      delay: index * .02,
      onUpdate: () => {
        element.castShadow = true;
      },
      onCompleteParams: [element, index],
      onComplete: (elm, i) => { 
        onComplete(elm, i);
      }
    })
  }

  animateOut(element, index) {
    TweenMax.to(element.position, 1.5, {
      y: -(this.coneHeight * .5),
      ease: Elastic.easeOut.config(1, .3),
      onCompleteParams: [element, index],
      onComplete: (elm, i) => {
        elm.castShadow = false;

        if (i===this.cones.length-1) {
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

    // gsap.to(this.cones, 0, {
    //   stagger: (index, target) => {
    //     TweenMax.to(target.position, 2, { 
    //       y: 2, 
    //       ease: Elastic.easeOut.config(1, .5), 
    //       delay: index * .02,
    //       yoyo: true, 
    //       yoyoEase: Elastic.easeOut.config(1.5, .6), 
    //       repeat: 1,
    //       onUpdate: () => {
    //         target.children[0].receiveShadow = true;
    //         target.children[0].castShadow = true;
    //       },
    //       onCompleteParams: [target, index], 
    //       onComplete: (elm, i) => {
    //         elm.children[0].receiveShadow = false;
    //         elm.children[0].castShadow = false;

    //         if(i===this.cones.length-1) {
    //           this.flipCamera();
    //           this.animateGrid();
    //         }
    //       }
    //     })
    //   },
    // });
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