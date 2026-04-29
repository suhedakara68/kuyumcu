// ============================================
// NOVENTRA AR — Virtual Try-On Service (Stable 3D)
// ============================================

class ARService {
  constructor() {
    this.hands = null;
    this.pose = null;
    this.camera = null;
    this.isTracking = false;
    this.mode = 'hand';
    
    this.scene = null;
    this.threeCamera = null;
    this.renderer = null;
    this.clock = null;
    this.modelGroup = null;
    this.isInitialized = false;
  }

  async init(videoElement, canvasElement) {
    if (this.isInitialized) return;

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    try {
      // Use standard versions for stability
      await this.loadScripts([
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      ]);

      // GLTFLoader usually needs a specific non-module build for direct script usage
      await this.loadScripts([
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js'
      ]);

      this.setupThreeJS();
      this.setupHands();
      this.setupPose();
      
      this.isInitialized = true;
    } catch (e) {
      console.error("Scripts could not be loaded:", e);
      throw e;
    }
  }

  loadScripts(urls) {
    return Promise.all(urls.map(url => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Script load error: ${url}`));
        document.head.appendChild(script);
        
        // Timeout
        setTimeout(() => reject(new Error(`Timeout loading ${url}`)), 10000);
      });
    }));
  }

  setupThreeJS() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.modelGroup = new THREE.Group();
    
    const aspect = this.canvasElement.clientWidth / this.canvasElement.clientHeight;
    this.threeCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.threeCamera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.canvasElement.clientWidth, this.canvasElement.clientHeight, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    this.scene.add(this.modelGroup);
    this.animate();
  }

  animate() {
    if (!this.renderer) return;
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.threeCamera);
  }

  async loadModel(url) {
    if (!url || !THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    this.modelGroup.clear();
    
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        this.modelGroup.add(gltf.scene);
        resolve(gltf.scene);
      }, undefined, (err) => {
        console.warn("Model error:", err);
        reject(err);
      });
    });
  }

  setupHands() {
    if (typeof Hands === 'undefined') return;
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults((results) => {
      if (this.mode === 'hand' && this.isTracking) this.update3DPosition(results);
    });
  }

  setupPose() {
    if (typeof Pose === 'undefined') return;
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
      if (this.mode === 'pose' && this.isTracking) this.update3DPosition(results);
    });
  }

  update3DPosition(results) {
    if (this.mode === 'hand') {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
         this.modelGroup.visible = false;
         return;
      }
      this.modelGroup.visible = true;
      const landmarks = results.multiHandLandmarks[0];
      const wrist = landmarks[0];
      const indexMcp = landmarks[5];
      const pinkyMcp = landmarks[17];

      // Conversion from 0-1 to Three.js space
      this.modelGroup.position.set((wrist.x - 0.5) * 5, -(wrist.y - 0.5) * 7, 0);
      
      const width = Math.sqrt(Math.pow(pinkyMcp.x - indexMcp.x, 2) + Math.pow(pinkyMcp.y - indexMcp.y, 2));
      this.modelGroup.scale.setScalar(width * 6);
      
      const angle = Math.atan2(pinkyMcp.y - indexMcp.y, pinkyMcp.x - indexMcp.x);
      this.modelGroup.rotation.z = -angle;

    } else if (results.poseLandmarks) {
      this.modelGroup.visible = true;
      const landmarks = results.poseLandmarks;
      const x = ((landmarks[11].x + landmarks[12].x) / 2 - 0.5) * 5;
      const y = -((landmarks[11].y + landmarks[12].y) / 2 - 0.5 + 0.1) * 7;
      this.modelGroup.position.set(x, y, 0);
      
      const shoulderWidth = Math.sqrt(Math.pow(landmarks[11].x - landmarks[12].x, 2));
      this.modelGroup.scale.setScalar(shoulderWidth * 5);
    }
  }

  async start(mode = 'hand', callback) {
    this.mode = mode;
    this.isTracking = true;

    if (!this.camera) {
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (!this.isTracking) return;
          if (this.mode === 'hand') await this.hands.send({ image: this.videoElement });
          else await this.pose.send({ image: this.videoElement });
        },
        width: 640,
        height: 480
      });
    }
    
    await this.camera.start();
  }

  stop() {
    this.isTracking = false;
    if (this.camera) this.camera.stop();
    this.modelGroup.visible = false;
  }
}

export const arService = new ARService();
