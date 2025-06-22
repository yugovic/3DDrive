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
        // 固定方向からのカメラ追従（車の向きに関係なく一定の方向から見る）
        const targetPosition = new THREE.Vector3().copy(target.position);
        
        // カメラの理想位置（ワールド座標系で固定方向）
        const idealPosition = new THREE.Vector3(
            targetPosition.x + offset.sideOffset,
            targetPosition.y + offset.height,
            targetPosition.z + offset.distance
        );
        
        // カメラ位置を滑らかに更新
        this.camera.position.lerp(idealPosition, offset.followFactor);
        
        // カメラは常に車両を注視
        this.camera.lookAt(targetPosition);
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