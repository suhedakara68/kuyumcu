// ============================================
// NOVENTRA AR — Virtual Try-On Service (Super Safe)
// ============================================

class ARService {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.modelGroup = null;
    this.hands = null;
    this.pose = null;
  }

  async init(video, canvas, statusCb) {
    if (this.isInitialized) return;
    this.statusCb = statusCb;
    this.video = video;
    this.canvas = canvas;

    this.statusCb("Kütüphaneler yükleniyor...");

    try {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
      await this.loadScript('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js', 'THREE.GLTFLoader');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', 'Hands');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js', 'Pose');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'Camera');

      this.statusCb("3D Dünya kuruluyor...");
      this.setupThree();
      
      this.statusCb("Yapay Zeka hazırlanıyor...");
      this.setupAI();
      
      this.isInitialized = true;
    } catch (e) {
      throw new Error("KRİTİK HATA: " + (e.message || e || "Bilinmeyen Yükleme Hatası"));
    }
  }

  loadScript(url, globalName) {
    return new Promise((resolve, reject) => {
      // Check if already exists in global scope
      const parts = globalName.split('.');
      let current = window;
      let exists = true;
      for (const p of parts) {
        if (!current[p]) { exists = false; break; }
        current = current[p];
      }
      if (exists) return resolve();

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        // Double check after load
        setTimeout(() => {
          let check = window;
          for (const p of parts) {
            if (!check[p]) { reject(new Error(`${globalName} yüklenemedi.`)); return; }
            check = check[p];
          }
          resolve();
        }, 100);
      };
      script.onerror = () => reject(new Error(`${url} adresine ulaşılamadı.`));
      document.head.appendChild(script);
      setTimeout(() => reject(new Error(`${globalName} için zaman aşımı.`)), 20000);
    });
  }

  setupThree() {
    this.scene = new THREE.Scene();
    this.modelGroup = new THREE.Group();
    this.threeCamera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.threeCamera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    this.scene.add(this.modelGroup);
    
    const animate = () => {
      if (!this.renderer) return;
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.threeCamera);
    };
    animate();
  }

  setupAI() {
    this.hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5 });
    this.hands.onResults((res) => { if (this.isTracking && this.mode === 'hand') this.updatePos(res); });

    this.pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    this.pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5 });
    this.pose.onResults((res) => { if (this.isTracking && this.mode === 'pose') this.updatePos(res); });
  }

  updatePos(res) {
    if (this.mode === 'hand' && res.multiHandLandmarks?.length > 0) {
      this.modelGroup.visible = true;
      const lm = res.multiHandLandmarks[0];
      this.modelGroup.position.set((lm[0].x - 0.5) * 5, -(lm[0].y - 0.5) * 7, 0);
      const w = Math.sqrt(Math.pow(lm[17].x - lm[5].x, 2) + Math.pow(lm[17].y - lm[5].y, 2));
      this.modelGroup.scale.setScalar(w * 6);
    } else if (this.mode === 'pose' && res.poseLandmarks) {
      this.modelGroup.visible = true;
      const lm = res.poseLandmarks;
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
      this.camera = new Camera(this.video, {
        onFrame: async () => {
          if (!this.isTracking) return;
          if (this.mode === 'hand') await this.hands.send({ image: this.video });
          else await this.pose.send({ image: this.video });
        },
        width: 640, height: 480
      });
    }
    await this.camera.start();
  }

  async loadModel(url) {
    if (!url || !THREE.GLTFLoader) return;
    const loader = new THREE.GLTFLoader();
    this.modelGroup.clear();
    return new Promise((res, rej) => {
      loader.load(url, (gltf) => { this.modelGroup.add(gltf.scene); res(); }, undefined, rej);
    });
  }

  stop() {
    this.isTracking = false;
    if (this.camera) this.camera.stop();
    if (this.modelGroup) this.modelGroup.visible = false;
  }
}

export const arService = new ARService();
