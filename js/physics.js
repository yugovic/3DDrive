// Cannon.js物理エンジン管理モジュール
import * as CONFIG from './config.js';

export class PhysicsManager {
    constructor() {
        this.world = null;
        this.materials = {};
        this.debugMode = false;
        this.debugMeshes = [];
    }

    init() {
        // 物理世界の作成
        this.world = new CANNON.World();
        this.world.gravity.set(
            CONFIG.PHYSICS.gravity.x,
            CONFIG.PHYSICS.gravity.y,
            CONFIG.PHYSICS.gravity.z
        );
        
        // ブロードフェーズの設定
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.broadphase.axisIndex = 0;
        
        // ソルバーの設定
        this.world.solver.iterations = 10;
        this.world.defaultContactMaterial.friction = CONFIG.PHYSICS.defaultMaterial.friction;
        this.world.defaultContactMaterial.restitution = CONFIG.PHYSICS.defaultMaterial.restitution;
        
        // マテリアルの作成
        this.createMaterials();
    }

    createMaterials() {
        // 地面マテリアル
        this.materials.ground = new CANNON.Material('ground');
        this.materials.ground.friction = CONFIG.PHYSICS.groundMaterial.friction;
        this.materials.ground.restitution = CONFIG.PHYSICS.groundMaterial.restitution;
        
        // 車輪マテリアル
        this.materials.wheel = new CANNON.Material('wheel');
        
        // コンタクトマテリアル（車輪と地面の接触）
        const wheelGroundContact = new CANNON.ContactMaterial(
            this.materials.wheel,
            this.materials.ground,
            {
                friction: CONFIG.PHYSICS.contactMaterial.friction,
                restitution: CONFIG.PHYSICS.contactMaterial.restitution,
                contactEquationStiffness: CONFIG.PHYSICS.contactMaterial.contactEquationStiffness,
                contactEquationRelaxation: CONFIG.PHYSICS.contactMaterial.contactEquationRelaxation
            }
        );
        this.world.addContactMaterial(wheelGroundContact);
    }

    update(deltaTime) {
        if (this.world) {
            this.world.step(deltaTime);
        }
        
        // デバッグ表示の更新
        if (this.debugMode) {
            this.updateDebugVisuals();
        }
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    setDebugMode(enabled, scene) {
        this.debugMode = enabled;
        
        if (!enabled) {
            // デバッグメッシュを削除
            this.clearDebugVisuals(scene);
        }
    }

    updateDebugVisuals() {
        // デバッグ用の物理ボディの可視化更新
        // 実装は後で必要に応じて追加
    }

    clearDebugVisuals(scene) {
        this.debugMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });
        this.debugMeshes = [];
    }

    createGroundBody(width = 200, height = 200) {
        const groundShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.1, height / 2));
        const groundBody = new CANNON.Body({
            mass: 0, // 静的ボディ
            shape: groundShape,
            material: this.materials.ground
        });
        groundBody.position.set(0, -0.1, 0);
        this.addBody(groundBody);
        return groundBody;
    }

    createBoxBody(size, mass = 1, position = { x: 0, y: 0, z: 0 }) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape
        });
        body.position.set(position.x, position.y, position.z);
        this.addBody(body);
        return body;
    }

    createSphereBody(radius, mass = 1, position = { x: 0, y: 0, z: 0 }) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape
        });
        body.position.set(position.x, position.y, position.z);
        this.addBody(body);
        return body;
    }

    // Three.jsのメッシュとCannon.jsのボディを同期
    syncMeshWithBody(mesh, body) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }

    dispose() {
        // 物理世界のクリーンアップ
        if (this.world) {
            // すべてのボディを削除
            while (this.world.bodies.length > 0) {
                this.world.removeBody(this.world.bodies[0]);
            }
            
            // すべての制約を削除
            while (this.world.constraints.length > 0) {
                this.world.removeConstraint(this.world.constraints[0]);
            }
        }
    }
}