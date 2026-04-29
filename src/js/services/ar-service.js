// ============================================
// NOVENTRA AR — Virtual Try-On Service (3D Edition)
// ============================================

/**
 * Handles MediaPipe tracking and Three.js 3D Rendering.
 * Integrates real-time 3D models with camera feed.
 */

class ARService {
  constructor() {
    this.hands = null;
    this.pose = null;
    this.camera = null;
    this.isTracking = false;
    this.mode = 'hand';
    
    // Three.js Core
    this.scene = null;
    this.threeCamera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.currentModel = null;
    this.modelGroup = new THREE.Group(); // Wrap models for easier manipulation
    
    this.onResultsCallback = null;
    this.lastLandmarks = null;
  }

  async init(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    // Load Scripts
    await this.loadScripts([
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/GLTFLoader.js'
    ]);

    this.setupThreeJS();
    this.setupHands();
    this.setupPose();
  }

  loadScripts(urls) {
    return Promise.all(urls.map(url => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }));
  }

  setupThreeJS() {
    this.scene = new THREE.Scene();
    
    // FOV Matching: As per the roadmap, match camera FOV
    const fov = 45;
    const aspect = this.canvasElement.clientWidth / this.canvasElement.clientHeight;
    this.threeCamera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.threeCamera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.canvasElement.clientWidth, this.canvasElement.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting (Premium Jewelry Look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(2, 2, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 1, 10); // Gold tint reflection
    pointLight.position.set(-2, 1, 3);
    this.scene.add(pointLight);

    this.scene.add(this.modelGroup);
    
    // Environment Mapping for Realistic Reflections
    this.setupEnvironment();
    
    // Sparkle Particle System
    this.setupSparkles();

    // Start Render Loop
    this.animate();
  }

  setupEnvironment() {
    // Creating a procedural environment map to make gold/diamonds reflect light
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create a simple colorful scene to act as reflection source
    const envScene = new THREE.Scene();
    const envLight = new THREE.PointLight(0xffffff, 50);
    envLight.position.set(5, 5, 5);
    envScene.add(envLight);
    
    const envTarget = pmremGenerator.fromScene(envScene);
    this.scene.environment = envTarget.texture;
  }

  setupSparkles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 20; i++) {
      vertices.push(0, 0, 0);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0,
      map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png'),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.sparkles = new THREE.Points(geometry, material);
    this.scene.add(this.sparkles);
  }

  animate() {
    if (!this.renderer) return;
    requestAnimationFrame(() => this.animate());
    
    const time = this.clock.getElapsedTime();
    
    // Animate Sparkles
    if (this.sparkles && this.modelGroup.visible) {
      const positions = this.sparkles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const angle = time * 2 + i;
        positions[i] = this.modelGroup.position.x + Math.sin(angle) * 0.5;
        positions[i+1] = this.modelGroup.position.y + Math.cos(angle) * 0.5;
        positions[i+2] = this.modelGroup.position.z + 0.2;
      }
      this.sparkles.geometry.attributes.position.needsUpdate = true;
      this.sparkles.material.opacity = (Math.sin(time * 5) + 1) * 0.5;
    } else if (this.sparkles) {
      this.sparkles.material.opacity = 0;
    }

    this.renderer.render(this.scene, this.threeCamera);
  }

  async loadModel(url) {
    if (!url) return;
    const loader = new THREE.GLTFLoader();
    
    // Clear previous model
    this.modelGroup.clear();
    
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        this.currentModel = gltf.scene;
        this.modelGroup.add(this.currentModel);
        resolve(this.currentModel);
      }, undefined, reject);
    });
  }

  setupHands() {
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => {
      if (this.mode === 'hand') {
        this.update3DPosition(results);
        if (this.onResultsCallback) this.onResultsCallback(results);
      }
    });
  }

  setupPose() {
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults((results) => {
      if (this.mode === 'pose') {
        this.update3DPosition(results);
        if (this.onResultsCallback) this.onResultsCallback(results);
      }
    });
  }

  update3DPosition(results) {
    let pos = null;
    if (this.mode === 'hand') {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
         this.modelGroup.visible = false;
         return;
      }
      this.modelGroup.visible = true;
      const landmarks = results.multiHandLandmarks[0];
      
      // Calculate wrist for bracelets or middle finger for rings
      const wrist = landmarks[0];
      const indexMcp = landmarks[5];
      const pinkyMcp = landmarks[17];

      // Screen to World Conversion (simplified for PWA)
      const x = (wrist.x - 0.5) * 4; 
      const y = -(wrist.y - 0.5) * 6;
      const z = -(wrist.z * 10); // Depth from MediaPipe

      this.modelGroup.position.set(x, y, z);
      
      // Rotation Vector (as per roadmap)
      const handVector = new THREE.Vector3(pinkyMcp.x - indexMcp.x, -(pinkyMcp.y - indexMcp.y), 0).normalize();
      const angle = Math.atan2(handVector.y, handVector.x);
      this.modelGroup.rotation.z = angle;
      
      // Scaling based on hand width
      const width = Math.sqrt(Math.pow(pinkyMcp.x - indexMcp.x, 2) + Math.pow(pinkyMcp.y - indexMcp.y, 2));
      this.modelGroup.scale.setScalar(width * 5);
      
    } else {
      // Pose Tracking for Necklaces
      if (!results.poseLandmarks) {
         this.modelGroup.visible = false;
         return;
      }
      this.modelGroup.visible = true;
      const landmarks = results.poseLandmarks;
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];

      const x = ((leftShoulder.x + rightShoulder.x) / 2 - 0.5) * 4;
      const y = -((leftShoulder.y + rightShoulder.y) / 2 - 0.5 + 0.1) * 6;
      
      this.modelGroup.position.set(x, y, 0);
      
      const shoulderWidth = Math.sqrt(Math.pow(leftShoulder.x - rightShoulder.x, 2));
      this.modelGroup.scale.setScalar(shoulderWidth * 4);
    }
  }

  async start(mode = 'hand', callback) {
    this.mode = mode;
    this.onResultsCallback = callback;
    this.isTracking = true;

    if (!this.camera) {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (!this.isTracking) return;
          if (this.mode === 'hand') {
            await this.hands.send({ image: this.videoElement });
          } else {
            await this.pose.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720
      });
    }
    
    await this.camera.start();
  }

  stop() {
    this.isTracking = false;
    if (this.camera) this.camera.stop();
    this.modelGroup.clear();
  }
}

export const arService = new ARService();
