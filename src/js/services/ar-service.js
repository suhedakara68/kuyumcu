// ============================================
// NOVENTRA AR — Virtual Try-On Service (Mobile Stable)
// ============================================

class ARService {
  constructor() {
    this.hands = null;
    this.pose = null;
    this.camera = null;
    this.isTracking = false;
    this.mode = 'hand';
    this.isInitialized = false;
  }

  async init(videoElement, canvasElement, statusCallback) {
    if (this.isInitialized) return;

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.statusCallback = statusCallback;

    if (this.statusCallback) this.statusCallback('Kütüphaneler indiriliyor...');

    try {
      // Step 1: Load Core Libraries
      await this.loadScripts([
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js'
      ]);

      if (this.statusCallback) this.statusCallback('3D Sahne hazırlanıyor...');
      this.setupThreeJS();
      
      if (this.statusCallback) this.statusCallback('Yapay Zeka kuruluyor...');
      this.setupHands();
      this.setupPose();
      
      this.isInitialized = true;
    } catch (e) {
      console.error("Init Error:", e);
      throw new Error("Kütüphaneler yüklenemedi. İnternet bağlantınızı kontrol edin.");
    }
  }

  loadScripts(urls) {
    return Promise.all(urls.map(url => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(url));
        document.head.appendChild(script);
        setTimeout(() => reject(new Error(`Zaman aşımı: ${url}`)), 15000);
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
    if (!url || typeof THREE.GLTFLoader === 'undefined') return;
    const loader = new THREE.GLTFLoader();
    this.modelGroup.clear();
    
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        this.modelGroup.add(gltf.scene);
        resolve(gltf.scene);
      }, undefined, reject);
    });
  }

  setupHands() {
    if (typeof Hands === 'undefined') return;
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    this.hands.onResults((res) => { if (this.isTracking && this.mode === 'hand') this.update3DPosition(res); });
  }

  setupPose() {
    if (typeof Pose === 'undefined') return;
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    this.pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    this.pose.onResults((res) => { if (this.isTracking && this.mode === 'pose') this.update3DPosition(res); });
  }

  update3DPosition(results) {
    if (this.mode === 'hand' && results.multiHandLandmarks?.length > 0) {
      this.modelGroup.visible = true;
      const lm = results.multiHandLandmarks[0];
      this.modelGroup.position.set((lm[0].x - 0.5) * 5, -(lm[0].y - 0.5) * 7, 0);
      const width = Math.sqrt(Math.pow(lm[17].x - lm[5].x, 2) + Math.pow(lm[17].y - lm[5].y, 2));
      this.modelGroup.scale.setScalar(width * 6);
    } else if (this.mode === 'pose' && results.poseLandmarks) {
      this.modelGroup.visible = true;
      const lm = results.poseLandmarks;
      this.modelGroup.position.set(((lm[11].x + lm[12].x) / 2 - 0.5) * 5, -((lm[11].y + lm[12].y) / 2 - 0.5 + 0.1) * 7, 0);
      const sw = Math.sqrt(Math.pow(lm[11].x - lm[12].x, 2));
      this.modelGroup.scale.setScalar(sw * 5);
    } else {
      this.modelGroup.visible = false;
    }
  }

  async start(mode = 'hand') {
    this.mode = mode;
    this.isTracking = true;

    if (!this.camera) {
      if (this.statusCallback) this.statusCallback('Kamera izni isteniyor...');
      
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (!this.isTracking) return;
          try {
            if (this.mode === 'hand') await this.hands.send({ image: this.videoElement });
            else await this.pose.send({ image: this.videoElement });
          } catch (e) {}
        },
        width: 640,
        height: 480
      });
    }
    
    try {
      await this.camera.start();
      if (this.statusCallback) this.statusCallback('Hazır! Elinizi/Boynunuzu gösterin');
      setTimeout(() => { if (this.statusCallback) this.statusCallback(''); }, 3000);
    } catch (e) {
      console.error("Camera Start Error:", e);
      throw new Error("Kamera başlatılamadı. İzinleri kontrol edin.");
    }
  }

  stop() {
    this.isTracking = false;
    if (this.camera) this.camera.stop();
    this.modelGroup.visible = false;
  }
}

export const arService = new ARService();
