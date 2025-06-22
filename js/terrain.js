// 地形・環境管理モジュール
import * as CONFIG from './config.js';

export class TerrainManager {
    constructor(physicsManager, sceneManager) {
        this.physicsManager = physicsManager;
        this.sceneManager = sceneManager;
        
        this.groundMesh = null;
        this.groundBody = null;
        this.slopeMesh = null;
        this.slopeBody = null;
        this.walls = [];
        this.obstacles = [];
        
        this.slopeHeight = CONFIG.SLOPE.defaultHeight;
        this.slopeAngle = Math.atan2(this.slopeHeight, CONFIG.SLOPE.length);
    }

    createTerrain() {
        // 地面の作成
        this.createGround();
        
        // 壁の作成
        this.createWalls();
        
        // スロープの作成
        this.createSlope();
        
        // 障害物の作成
        this.createObstacles();
    }

    createGround() {
        // 物理ボディ
        this.groundBody = this.physicsManager.createGroundBody(200, 200);
        
        // メッシュ
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3c8f3c,
            side: THREE.DoubleSide
        });
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.sceneManager.scene.add(this.groundMesh);
        
        // グリッドヘルパー
        const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x000000);
        gridHelper.position.y = 0.01;
        this.sceneManager.scene.add(gridHelper);
    }

    createWalls() {
        const wallThickness = 2;
        const wallHeight = 10;
        const wallLength = 100;
        
        // 壁の設定
        const wallConfigs = [
            { position: { x: 0, y: wallHeight/2, z: -wallLength/2 }, rotation: 0, size: { x: wallLength, y: wallHeight, z: wallThickness } },
            { position: { x: 0, y: wallHeight/2, z: wallLength/2 }, rotation: 0, size: { x: wallLength, y: wallHeight, z: wallThickness } },
            { position: { x: -wallLength/2, y: wallHeight/2, z: 0 }, rotation: Math.PI/2, size: { x: wallThickness, y: wallHeight, z: wallLength } },
            { position: { x: wallLength/2, y: wallHeight/2, z: 0 }, rotation: Math.PI/2, size: { x: wallThickness, y: wallHeight, z: wallLength } }
        ];
        
        wallConfigs.forEach(config => {
            // 物理ボディ
            const wallShape = new CANNON.Box(new CANNON.Vec3(
                config.size.x / 2,
                config.size.y / 2,
                config.size.z / 2
            ));
            const wallBody = new CANNON.Body({
                mass: 0,
                shape: wallShape,
                material: this.physicsManager.materials.ground
            });
            wallBody.position.set(config.position.x, config.position.y, config.position.z);
            if (config.rotation) {
                wallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), config.rotation);
            }
            this.physicsManager.addBody(wallBody);
            
            // メッシュ
            const wallGeometry = new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z);
            const wallMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                transparent: true,
                opacity: 0.7
            });
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.copy(config.position);
            if (config.rotation) {
                wallMesh.rotation.y = config.rotation;
            }
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            this.sceneManager.scene.add(wallMesh);
            
            this.walls.push({ mesh: wallMesh, body: wallBody });
        });
    }

    createSlope() {
        const slopePosition = CONFIG.SLOPE.position;
        
        // スロープのジオメトリ（回転した平面）
        const slopeGeometry = new THREE.PlaneGeometry(CONFIG.SLOPE.width, CONFIG.SLOPE.length);
        const slopeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            side: THREE.DoubleSide
        });
        
        this.slopeMesh = new THREE.Mesh(slopeGeometry, slopeMaterial);
        this.slopeMesh.rotation.x = -Math.PI / 2 + this.slopeAngle;
        this.slopeMesh.position.set(
            slopePosition.x,
            slopePosition.y,
            slopePosition.z
        );
        this.slopeMesh.receiveShadow = true;
        this.slopeMesh.castShadow = true;
        this.sceneManager.scene.add(this.slopeMesh);
        
        // スロープの物理ボディ（ボックス形状を回転）
        const slopeShape = new CANNON.Box(new CANNON.Vec3(
            CONFIG.SLOPE.width / 2,
            0.1,
            CONFIG.SLOPE.length / 2
        ));
        
        this.slopeBody = new CANNON.Body({
            mass: 0,
            shape: slopeShape,
            material: this.physicsManager.materials.ground
        });
        
        // 位置と回転を設定
        this.slopeBody.position.set(
            slopePosition.x,
            slopePosition.y,
            slopePosition.z
        );
        
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -this.slopeAngle);
        this.slopeBody.quaternion.copy(quaternion);
        
        this.physicsManager.addBody(this.slopeBody);
    }

    createObstacles() {
        const numObstacles = 10;
        const minRadius = 0.5;
        const maxRadius = 2;
        
        for (let i = 0; i < numObstacles; i++) {
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            const angle = (i / numObstacles) * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            const position = {
                x: Math.cos(angle) * distance,
                y: radius,
                z: Math.sin(angle) * distance
            };
            
            // 物理ボディ
            const sphereBody = this.physicsManager.createSphereBody(radius, 100, position);
            
            // メッシュ
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 16);
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
            });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphereMesh.position.copy(position);
            sphereMesh.castShadow = true;
            sphereMesh.receiveShadow = true;
            this.sceneManager.scene.add(sphereMesh);
            
            this.obstacles.push({
                mesh: sphereMesh,
                body: sphereBody,
                radius: radius,
                initialPosition: position
            });
        }
    }

    updateObstacles() {
        // 障害物の物理同期
        this.obstacles.forEach(obstacle => {
            this.physicsManager.syncMeshWithBody(obstacle.mesh, obstacle.body);
            
            // 落下した障害物をリセット
            if (obstacle.body.position.y < -10) {
                obstacle.body.position.copy(obstacle.initialPosition);
                obstacle.body.velocity.set(0, 0, 0);
            }
        });
    }

    adjustSlopeHeight(delta) {
        this.slopeHeight = Math.max(0.5, Math.min(10, this.slopeHeight + delta * CONFIG.SLOPE.adjustmentStep));
        this.slopeAngle = Math.atan2(this.slopeHeight, CONFIG.SLOPE.length);
        this.updateSlopeGeometry();
    }

    updateSlopeGeometry() {
        if (!this.slopeMesh || !this.slopeBody) return;
        
        // メッシュの更新
        this.slopeMesh.rotation.x = -Math.PI / 2 + this.slopeAngle;
        this.slopeMesh.position.y = this.slopeHeight / 2;
        
        // 物理ボディの更新
        this.slopeBody.position.y = this.slopeHeight / 2;
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -this.slopeAngle);
        this.slopeBody.quaternion.copy(quaternion);
    }

    update(deltaTime) {
        // 障害物の更新
        this.updateObstacles();
    }

    dispose() {
        // 地面の削除
        if (this.groundMesh) {
            this.sceneManager.scene.remove(this.groundMesh);
            if (this.groundMesh.geometry) this.groundMesh.geometry.dispose();
            if (this.groundMesh.material) this.groundMesh.material.dispose();
        }
        if (this.groundBody) {
            this.physicsManager.removeBody(this.groundBody);
        }
        
        // スロープの削除
        if (this.slopeMesh) {
            this.sceneManager.scene.remove(this.slopeMesh);
            if (this.slopeMesh.geometry) this.slopeMesh.geometry.dispose();
            if (this.slopeMesh.material) this.slopeMesh.material.dispose();
        }
        if (this.slopeBody) {
            this.physicsManager.removeBody(this.slopeBody);
        }
        
        // 壁の削除
        this.walls.forEach(wall => {
            this.sceneManager.scene.remove(wall.mesh);
            if (wall.mesh.geometry) wall.mesh.geometry.dispose();
            if (wall.mesh.material) wall.mesh.material.dispose();
            this.physicsManager.removeBody(wall.body);
        });
        
        // 障害物の削除
        this.obstacles.forEach(obstacle => {
            this.sceneManager.scene.remove(obstacle.mesh);
            if (obstacle.mesh.geometry) obstacle.mesh.geometry.dispose();
            if (obstacle.mesh.material) obstacle.mesh.material.dispose();
            this.physicsManager.removeBody(obstacle.body);
        });
        
        this.walls = [];
        this.obstacles = [];
    }
}