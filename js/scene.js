// Three.jsシーン管理モジュール
import * as CONFIG from './config.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = {};
    }

    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // 空色
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 200); // フォグ効果

        // カメラの作成
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.CAMERA.near,
            CONFIG.CAMERA.far
        );
        this.camera.position.set(
            CONFIG.CAMERA.initialPosition.x,
            CONFIG.CAMERA.initialPosition.y,
            CONFIG.CAMERA.initialPosition.z
        );
        this.camera.lookAt(0, 0, 0);

        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // ライトの設定
        this.setupLights();

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        // アンビエントライト
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.lights.ambient);

        // ディレクショナルライト（太陽光）
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(10, 20, 5);
        this.lights.directional.castShadow = true;
        
        // シャドウマップの設定
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 500;
        this.lights.directional.shadow.camera.left = -50;
        this.lights.directional.shadow.camera.right = 50;
        this.lights.directional.shadow.camera.top = 50;
        this.lights.directional.shadow.camera.bottom = -50;
        
        this.scene.add(this.lights.directional);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    updateCameraPosition(target, offset = CONFIG.CAMERA.adjustments) {
        // カメラの滑らかな追従
        const idealOffset = new THREE.Vector3(
            offset.sideOffset,
            offset.height,
            offset.distance
        );
        
        // ターゲットの向きに合わせてオフセットを回転
        idealOffset.applyQuaternion(target.quaternion);
        idealOffset.add(target.position);
        
        // カメラ位置を滑らかに更新
        this.camera.position.lerp(idealOffset, offset.followFactor);
        
        // カメラの注視点を更新
        const lookAtPosition = new THREE.Vector3().copy(target.position);
        lookAtPosition.y += 2; // 少し上を見る
        this.camera.lookAt(lookAtPosition);
    }

    dispose() {
        // レンダラーの破棄
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        // イベントリスナーの削除
        window.removeEventListener('resize', this.onWindowResize);
    }
}