// ============================================
// NOVENTRA AR — Virtual Try-On Service (Snapshot & Blend)
// ============================================

class ARService {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.isFrozen = false;
    this.modelGroup = null;
    this.debugDots = [];
  }

  async init(video, canvas, statusCb) {
    if (this.isInitialized) return;
    this.statusCb = statusCb;
    this.video = video;
    this.canvas = canvas;

    try {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
      await this.loadScript('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js', 'THREE.GLTFLoader');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', 'Hands');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js', 'Pose');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'Camera');

      this.setupThree();
      this.setupAI();
      this.isInitialized = true;
    } catch (e) {
      throw new Error("Yükleme Hatası: İnternetinizi kontrol edin.");
    }
  }

  loadScript(url, globalName) {
    return new Promise((resolve, reject) => {
      const parts = globalName.split('.');
      let current = window;
      let exists = true;
      for (const p of parts) { if (!current[p]) { exists = false; break; } current = current[p]; }
      if (exists) return resolve();

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => setTimeout(resolve, 200);
      script.onerror = () => reject(new Error(globalName));
      document.head.appendChild(script);
      setTimeout(() => reject(new Error("Zaman aşımı")), 20000);
    });
  }

  setupThree() {
    this.scene = new THREE.Scene();
    this.modelGroup = new THREE.Group();
    this.threeCamera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
    this.threeCamera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    
    this.scene.add(new THREE.AmbientLight(0xffffff, 2));
    const p1 = new THREE.PointLight(0xffffff, 1.5); p1.position.set(2, 2, 5); this.scene.add(p1);

    this.scene.add(this.modelGroup);
    const animate = () => { if(this.renderer) { requestAnimationFrame(animate); this.renderer.render(this.scene, this.threeCamera); }};
    animate();
  }

  setupAI() {
    this.hands = new Hands({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
    this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5 });
    this.hands.onResults((r) => this.onResults(r));

    this.pose = new Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
    this.pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5 });
    this.pose.onResults((r) => this.onResults(r));
  }

  onResults(results) {
    if (!this.isTracking || this.isFrozen) return;
    
    let target = null;
    if (this.mode === 'hand' && results.multiHandLandmarks?.length > 0) {
      const lm = results.multiHandLandmarks[0];
      target = { x: lm[0].x, y: lm[0].y, z: lm[0].z, scale: Math.sqrt(Math.pow(lm[17].x - lm[5].x, 2)) * 6 };
    } else if (this.mode === 'pose' && results.poseLandmarks) {
      const lm = results.poseLandmarks;
      target = { x: (lm[11].x + lm[12].x)/2, y: (lm[11].y + lm[12].y)/2 + 0.1, scale: Math.sqrt(Math.pow(lm[11].x - lm[12].x, 2)) * 4 };
    }

    if (target) {
      this.modelGroup.visible = true;
      this.modelGroup.position.set((target.x - 0.5) * 5, -(target.y - 0.5) * 7, 0);
      this.modelGroup.scale.setScalar(target.scale);
    } else {
      this.modelGroup.visible = false;
    }
  }

  async takeSnapshot() {
    this.isFrozen = true;
    if (this.camera) this.camera.stop();
    
    // Create a static background from the current video frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.video.videoWidth;
    tempCanvas.height = this.video.videoHeight;
    tempCanvas.getContext('2d').drawImage(this.video, 0, 0);
    
    const bgData = tempCanvas.toDataURL('image/jpeg');
    return bgData;
  }

  async start(mode = 'hand') {
    this.mode = mode;
    this.isTracking = true;
    this.isFrozen = false;
    if (!this.camera) {
      this.camera = new Camera(this.video, {
        onFrame: async () => {
          if (!this.isTracking || this.isFrozen) return;
          try {
            if (this.mode === 'hand') await this.hands.send({ image: this.video });
            else await this.pose.send({ image: this.video });
          } catch(e) {}
        }
      });
    }
    await this.camera.start();
  }

  async loadModel(url, fallbackImg) {
    this.modelGroup.clear();
    
    // Try 3D
    if (url && typeof THREE.GLTFLoader !== 'undefined') {
      const loader = new THREE.GLTFLoader();
      try {
        await new Promise((res, rej) => {
          loader.load(url, (gltf) => { this.modelGroup.add(gltf.scene); res(); }, undefined, rej);
        });
        return;
      } catch (e) { console.warn("3D failed, using 2D"); }
    }

    // Fallback to 2D Image with Multiply Blending to remove white background
    if (fallbackImg) {
      const tex = new THREE.TextureLoader().load(fallbackImg);
      // MultiplyBlending requires white background on source to work effectively
      const mat = new THREE.MeshBasicMaterial({ 
        map: tex, 
        transparent: true, 
        blending: THREE.MultiplyBlending,
        side: THREE.DoubleSide 
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      this.modelGroup.add(plane);
    }
  }

  stop() {
    this.isTracking = false;
    this.isFrozen = false;
    if (this.camera) this.camera.stop();
    if (this.modelGroup) this.modelGroup.visible = false;
  }
}

export const arService = new ARService();
