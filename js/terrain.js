// 地形・環境管理モジュール
import * as CONFIG from './config.js';

export class TerrainManager {
    constructor(physicsManager, sceneManager) {
        this.physicsManager = physicsManager;
        this.sceneManager = sceneManager;
        this.uiManager = null; // UIマネージャーへの参照（後で設定）
        
        this.groundMesh = null;
        this.groundBody = null;
        this.slopeMesh = null;
        this.slopeBody = null;
        this.walls = [];
        this.obstacles = [];
        this.ramps = [];
        this.elevators = [];
        this.movingPlatforms = [];
        this.boostPads = [];
        this.jumpPads = [];
        
        this.slopeHeight = CONFIG.SLOPE.defaultHeight;
        this.slopeAngle = Math.atan2(this.slopeHeight, CONFIG.SLOPE.length);
    }

    // UIマネージャーを設定
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    createTerrain() {
        // 地面の作成
        this.createGround();
        
        // 境界の作成（透明な壁ではなく、見える柵）
        this.createBoundaries();
        
        // 複数のランプ/スロープを作成
        this.createRamps();
        
        // 障害物の作成
        this.createObstacles();
        
        // ギミックの作成
        this.createGimmicks();
    }

    createGround() {
        // 物理ボディ
        const groundSize = 300;
        this.groundBody = this.physicsManager.createGroundBody(groundSize, groundSize);
        
        // メインの地面メッシュ（アスファルト風）
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundTexture = this.createAsphaltTexture();
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            map: groundTexture,
            side: THREE.DoubleSide
        });
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        // 地面のレンダリング順序を最初に設定
        this.groundMesh.renderOrder = 0;
        this.sceneManager.scene.add(this.groundMesh);
        
        // グリッドヘルパー（薄く表示）
        const gridHelper = new THREE.GridHelper(200, 40, 0x444444, 0x222222);
        gridHelper.position.y = 0.01;
        this.sceneManager.scene.add(gridHelper);
        
        // センターライン
        this.createCenterLines();
    }

    createAsphaltTexture() {
        // 簡易的なアスファルトテクスチャを生成
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // ベースカラー
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 512, 512);
        
        // ノイズを追加
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const brightness = Math.random() * 30 + 20;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fillRect(x, y, 2, 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        return texture;
    }

    createCenterLines() {
        // 中央の十字線
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        
        // X軸方向のライン
        const xLineGeometry = new THREE.BoxGeometry(100, 0.1, 0.3);
        const xLine = new THREE.Mesh(xLineGeometry, lineMaterial);
        xLine.position.y = 0.02;
        this.sceneManager.scene.add(xLine);
        
        // Z軸方向のライン
        const zLineGeometry = new THREE.BoxGeometry(0.3, 0.1, 100);
        const zLine = new THREE.Mesh(zLineGeometry, lineMaterial);
        zLine.position.y = 0.02;
        this.sceneManager.scene.add(zLine);
    }

    createBoundaries() {
        const boundaryHeight = 3;
        const boundaryThickness = 0.5;
        const boundaryLength = 150;
        
        // フェンスマテリアル
        const fenceMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // 境界の設定（見える柵として）
        const boundaryConfigs = [
            { position: { x: 0, y: boundaryHeight/2, z: -boundaryLength/2 }, rotation: 0 },
            { position: { x: 0, y: boundaryHeight/2, z: boundaryLength/2 }, rotation: 0 },
            { position: { x: -boundaryLength/2, y: boundaryHeight/2, z: 0 }, rotation: Math.PI/2 },
            { position: { x: boundaryLength/2, y: boundaryHeight/2, z: 0 }, rotation: Math.PI/2 }
        ];
        
        boundaryConfigs.forEach(config => {
            // 物理ボディ（見えない壁）
            const wallShape = new CANNON.Box(new CANNON.Vec3(
                boundaryLength / 2,
                boundaryHeight / 2,
                boundaryThickness / 2
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
            
            // フェンスのメッシュ（縦棒）
            const fenceGroup = new THREE.Group();
            const poleCount = 30;
            for (let i = 0; i < poleCount; i++) {
                const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, boundaryHeight);
                const pole = new THREE.Mesh(poleGeometry, fenceMaterial);
                pole.position.x = (i - poleCount/2) * (boundaryLength / poleCount);
                pole.castShadow = true;
                fenceGroup.add(pole);
            }
            
            // 横棒
            const railGeometry = new THREE.BoxGeometry(boundaryLength, 0.1, 0.1);
            const topRail = new THREE.Mesh(railGeometry, fenceMaterial);
            topRail.position.y = boundaryHeight / 2 - 0.1;
            topRail.castShadow = true;
            fenceGroup.add(topRail);
            
            const bottomRail = new THREE.Mesh(railGeometry, fenceMaterial);
            bottomRail.position.y = 0.5;
            bottomRail.castShadow = true;
            fenceGroup.add(bottomRail);
            
            fenceGroup.position.copy(config.position);
            if (config.rotation) {
                fenceGroup.rotation.y = config.rotation;
            }
            this.sceneManager.scene.add(fenceGroup);
            
            this.walls.push({ mesh: fenceGroup, body: wallBody });
        });
    }

    createRamps() {
        // 複数のランプを異なる場所に配置（Y位置は全て0で地面レベル）
        const rampConfigs = [
            { 
                position: { x: 0, y: 0, z: -30 }, 
                rotation: 0, 
                width: 12, 
                length: 25, 
                height: 4,
                color: 0x4488ff 
            },
            { 
                position: { x: 40, y: 0, z: 0 }, 
                rotation: Math.PI / 2, 
                width: 10, 
                length: 20, 
                height: 3,
                color: 0xff4444 
            },
            { 
                position: { x: -40, y: 0, z: 30 }, 
                rotation: -Math.PI / 2, 
                width: 14, 
                length: 22, 
                height: 3.5,
                color: 0x44ff44 
            }
        ];
        
        rampConfigs.forEach((config, index) => {
            const ramp = this.createRamp(config);
            this.ramps.push(ramp);
        });
    }

    createRamp(config) {
        const { position, rotation, width, length, height, color } = config;
        
        // ランプグループ
        const rampGroup = new THREE.Group();
        const rampMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        
        // より細かいセグメント（特に入り口部分）
        const totalLength = length * 1.5; // 全体を1.5倍に延長してより緩やかに
        const segments = 80; // セグメント数を4倍に増加
        const segmentLength = totalLength / segments;
        
        // 各セグメントを作成
        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1); // 0から1の正規化位置
            
            // より緩やかなイージング関数（最初は特に緩やか）
            // 3次のイージング関数で、最初の部分をより平坦に
            const easeT = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep関数
            
            // 高さの計算（最初の20%は特に緩やか）
            let segmentY;
            if (t < 0.2) {
                // 最初の20%は二次関数でさらに緩やかに
                segmentY = height * (t * t * 25 * 0.2); // 0.2で高さの20%に到達
            } else {
                // 残りは通常のイージング
                const adjustedT = (t - 0.2) / 0.8;
                segmentY = height * (0.2 + 0.8 * adjustedT * adjustedT * (3 - 2 * adjustedT));
            }
            
            // 次のセグメントの高さを計算
            const nextT = Math.min(1, (i + 1) / (segments - 1));
            let nextY;
            if (nextT < 0.2) {
                nextY = height * (nextT * nextT * 25 * 0.2);
            } else {
                const adjustedNextT = (nextT - 0.2) / 0.8;
                nextY = height * (0.2 + 0.8 * adjustedNextT * adjustedNextT * (3 - 2 * adjustedNextT));
            }
            
            const angleForSegment = Math.atan2(nextY - segmentY, segmentLength);
            
            // セグメントのメッシュ（薄くして段差を減らす）
            const segmentThickness = 0.3 - (0.2 * t); // 入り口ほど薄く
            const segmentGeometry = new THREE.BoxGeometry(width, segmentThickness, segmentLength * 1.05); // わずかに重ねる
            const segmentMesh = new THREE.Mesh(segmentGeometry, rampMaterial);
            
            // 位置と回転の設定
            segmentMesh.position.z = -totalLength/2 + i * segmentLength + segmentLength/2;
            segmentMesh.position.y = segmentY + segmentThickness/2 * Math.cos(angleForSegment);
            segmentMesh.rotation.x = -angleForSegment;
            
            segmentMesh.receiveShadow = true;
            segmentMesh.castShadow = true;
            rampGroup.add(segmentMesh);
        }
        
        // 上部プラットフォーム（平らな部分）
        const platformLength = 8;
        const platformGeometry = new THREE.BoxGeometry(width, 0.5, platformLength);
        const platformMesh = new THREE.Mesh(platformGeometry, rampMaterial);
        platformMesh.position.y = height;
        platformMesh.position.z = totalLength/2 + platformLength/2; // 終端側に配置（符号を修正）
        rampGroup.add(platformMesh);
        
        // ランプグループの位置と回転を設定
        rampGroup.position.set(position.x, 0, position.z); // Y位置は0（地面レベル）から開始
        rampGroup.rotation.y = rotation;
        this.sceneManager.scene.add(rampGroup);
        
        // サイドガードレール（視覚的なガイド）
        const railMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        
        // レールポストの作成
        const postCount = segments / 2;
        for (let i = 0; i <= postCount; i++) {
            const t = i / postCount;
            const easeT = t * t * (3 - 2 * t);
            const postY = height * easeT;
            
            // 左側のポスト
            const leftPostGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
            const leftPost = new THREE.Mesh(leftPostGeometry, railMaterial);
            leftPost.position.set(-width/2 - 0.3, postY + 0.75, -length/2 + t * length);
            rampGroup.add(leftPost);
            
            // 右側のポスト
            const rightPost = new THREE.Mesh(leftPostGeometry, railMaterial);
            rightPost.position.set(width/2 + 0.3, postY + 0.75, -length/2 + t * length);
            rampGroup.add(rightPost);
        }
        
        // 物理ボディ（複合形状）
        const rampBody = new CANNON.Body({
            mass: 0,
            material: this.physicsManager.materials.ground
        });
        
        // セグメントごとの物理形状を追加
        const physicsSegments = 40; // 物理用も細かく（視覚の半分）
        const physicsSegmentLength = totalLength / physicsSegments;
        
        for (let i = 0; i < physicsSegments; i++) {
            const t = i / (physicsSegments - 1);
            
            // 高さの計算（視覚と同じロジック）
            let segmentY;
            if (t < 0.2) {
                segmentY = height * (t * t * 25 * 0.2);
            } else {
                const adjustedT = (t - 0.2) / 0.8;
                segmentY = height * (0.2 + 0.8 * adjustedT * adjustedT * (3 - 2 * adjustedT));
            }
            
            const nextT = Math.min(1, (i + 1) / (physicsSegments - 1));
            let nextY;
            if (nextT < 0.2) {
                nextY = height * (nextT * nextT * 25 * 0.2);
            } else {
                const adjustedNextT = (nextT - 0.2) / 0.8;
                nextY = height * (0.2 + 0.8 * adjustedNextT * adjustedNextT * (3 - 2 * adjustedNextT));
            }
            
            const angleForSegment = Math.atan2(nextY - segmentY, physicsSegmentLength);
            const segmentThickness = 0.3 - (0.2 * t);
            
            // 各セグメントの物理形状
            const segmentShape = new CANNON.Box(new CANNON.Vec3(width/2, segmentThickness/2, physicsSegmentLength/2 * 1.05));
            const segmentOffset = new CANNON.Vec3(
                0,
                segmentY + segmentThickness/2 * Math.cos(angleForSegment),
                -totalLength/2 + i * physicsSegmentLength + physicsSegmentLength/2
            );
            const segmentQuat = new CANNON.Quaternion();
            segmentQuat.setFromEuler(-angleForSegment, 0, 0);
            
            rampBody.addShape(segmentShape, segmentOffset, segmentQuat);
        }
        
        // 上部プラットフォームの物理形状
        const platformShape = new CANNON.Box(new CANNON.Vec3(width/2, 0.25, 4));
        const platformOffset = new CANNON.Vec3(0, height, totalLength/2 + 4); // 終端側に配置（符号を修正）
        rampBody.addShape(platformShape, platformOffset);
        
        // ボディ全体の位置と回転を設定
        rampBody.position.set(position.x, 0, position.z);
        const bodyQuat = new CANNON.Quaternion();
        bodyQuat.setFromEuler(0, rotation, 0);
        rampBody.quaternion.copy(bodyQuat);
        
        this.physicsManager.addBody(rampBody);
        
        return { mesh: rampGroup, body: rampBody, config: config };
    }

    createObstacles() {
        // より面白い障害物を作成
        const obstacleTypes = [
            { type: 'cone', color: 0xff6600, count: 15 },
            { type: 'box', color: 0x0066ff, count: 10 },
            { type: 'sphere', color: 0xff00ff, count: 8 }
        ];
        
        obstacleTypes.forEach(obstacleType => {
            for (let i = 0; i < obstacleType.count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 60;
                const position = {
                    x: Math.cos(angle) * distance,
                    y: 1,
                    z: Math.sin(angle) * distance
                };
                
                // ランプの近くは避ける
                let tooClose = false;
                this.ramps.forEach(ramp => {
                    const dist = Math.sqrt(
                        Math.pow(position.x - ramp.config.position.x, 2) + 
                        Math.pow(position.z - ramp.config.position.z, 2)
                    );
                    if (dist < 15) tooClose = true;
                });
                
                if (tooClose) continue;
                
                this.createObstacle(obstacleType.type, obstacleType.color, position);
            }
        });
    }

    createObstacle(type, color, position) {
        let geometry, shape, mass;
        
        switch(type) {
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1.5, 6);
                shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 0.5));
                mass = 5;
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
                mass = 20;
                break;
            case 'sphere':
            default:
                geometry = new THREE.SphereGeometry(0.7, 16, 8);
                shape = new CANNON.Sphere(0.7);
                mass = 10;
                break;
        }
        
        // メッシュ
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.sceneManager.scene.add(mesh);
        
        // 物理ボディ
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: this.physicsManager.materials.ground
        });
        body.position.copy(position);
        this.physicsManager.addBody(body);
        
        this.obstacles.push({
            mesh: mesh,
            body: body,
            type: type,
            initialPosition: { ...position }
        });
    }

    updateObstacles() {
        // 障害物の物理同期
        this.obstacles.forEach(obstacle => {
            this.physicsManager.syncMeshWithBody(obstacle.mesh, obstacle.body);
            
            // 落下した障害物をリセット
            if (obstacle.body.position.y < -10) {
                obstacle.body.position.copy(obstacle.initialPosition);
                obstacle.body.velocity.set(0, 0, 0);
                obstacle.body.angularVelocity.set(0, 0, 0);
            }
        });
    }

    adjustSlopeHeight(delta) {
        // 最初のランプの高さを調整
        if (this.ramps.length > 0) {
            const ramp = this.ramps[0];
            ramp.config.height = Math.max(0.5, Math.min(10, ramp.config.height + delta * CONFIG.SLOPE.adjustmentStep));
            
            // ランプを再作成
            this.sceneManager.scene.remove(ramp.mesh);
            this.physicsManager.removeBody(ramp.body);
            
            const newRamp = this.createRamp(ramp.config);
            this.ramps[0] = newRamp;
        }
    }

    createGimmicks() {
        // エレベーターの作成
        this.createElevator({ x: 20, y: 0, z: -50 }, 8, 0xff00ff); // 紫色のエレベーター
        this.createElevator({ x: -20, y: 0, z: -50 }, 6, 0x00ffff); // 水色のエレベーター
        
        // 動く足場の作成
        this.createMovingPlatform({ x: 0, y: 2, z: 50 }, 15, 'horizontal', 0x00ff00);
        
        // 加速ゾーンの作成
        this.createBoostPad({ x: 0, y: 0, z: 0 }, 0); // 中央、北向き
        this.createBoostPad({ x: 60, y: 0, z: 0 }, Math.PI / 2); // 東側、東向き
        this.createBoostPad({ x: -60, y: 0, z: 0 }, -Math.PI / 2); // 西側、西向き
        
        // ジャンプパッドの作成
        this.createJumpPad({ x: 0, y: 0, z: 20 });
        this.createJumpPad({ x: 30, y: 0, z: -30 });
        this.createJumpPad({ x: -30, y: 0, z: -30 });
    }
    
    createElevator(position, maxHeight, color) {
        // エレベーターのプラットフォーム
        const platformSize = { width: 6, depth: 6, height: 0.5 };
        const platformGeometry = new THREE.BoxGeometry(platformSize.width, platformSize.height, platformSize.depth);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.2,
            // Z-fighting対策: ポリゴンオフセットを使用
            polygonOffset: true,
            polygonOffsetFactor: -1, // 負の値で手前に描画
            polygonOffsetUnits: -1
        });
        
        const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        // 床板の上面が地面より少し上になるように配置（Z-fighting回避）
        const zFightingOffset = 0.01; // 1cm上にオフセット
        // メッシュの初期位置（Y座標はボックスの中心）
        const meshInitialY = -platformSize.height/2 + zFightingOffset;
        platformMesh.position.set(position.x, meshInitialY, position.z);
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        // レンダリング順序を設定（地面より後に描画）
        platformMesh.renderOrder = 1;
        this.sceneManager.scene.add(platformMesh);
        
        // 支柱（視覚的ガイド）
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, maxHeight + platformSize.height);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        for (let i = 0; i < 4; i++) {
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            const offsetX = (i % 2 === 0 ? 1 : -1) * (platformSize.width/2 - 0.3);
            const offsetZ = (i < 2 ? 1 : -1) * (platformSize.depth/2 - 0.3);
            pole.position.set(position.x + offsetX, maxHeight/2, position.z + offsetZ);
            pole.castShadow = true;
            this.sceneManager.scene.add(pole);
        }
        
        // 物理ボディ（キネマティック）
        const platformShape = new CANNON.Box(new CANNON.Vec3(
            platformSize.width/2,
            platformSize.height/2,
            platformSize.depth/2
        ));
        const platformBody = new CANNON.Body({
            mass: 0, // キネマティック（手動で動かす）
            shape: platformShape,
            type: CANNON.Body.KINEMATIC,
            material: this.physicsManager.materials.elevator || this.physicsManager.materials.ground, // エレベーター専用マテリアル
            collisionResponse: true, // 衝突応答を有効化（完全な剛体）
            fixedRotation: true // 回転を固定
        });
        // コリジョンボディの位置をメッシュと同じに設定
        platformBody.position.set(position.x, meshInitialY, position.z);
        // 初期速度を設定
        platformBody.velocity.set(0, 0, 0);
        platformBody.angularVelocity.set(0, 0, 0);
        this.physicsManager.addBody(platformBody);
        
        // 安全センサーゾーンのパラメータのみ保存（物理ボディは作成しない）
        const sensorHeight = 3.0; // センサーゾーンの高さ
        const sensorWidth = platformSize.width + 1.0; // エレベーターより少し広い範囲
        const sensorDepth = platformSize.depth + 1.0;
        
        // エレベーターデータを保存
        this.elevators.push({
            mesh: platformMesh,
            body: platformBody,
            position: position, // エレベーターの基準位置
            minY: meshInitialY, // メッシュの初期位置を使用
            maxY: maxHeight + meshInitialY, // 最高位置も同じオフセットを適用
            speed: 0.5, // m/s (さらに速度を遅くして安定性を向上)
            direction: 1,
            waitTime: 2, // 上下での待機時間
            waitTimer: 0,
            platformHeight: platformSize.height, // プラットフォームの高さを保存
            safetyStop: false, // 安全停止状態
            sensorHeight: sensorHeight, // センサーゾーンの高さ
            sensorWidth: sensorWidth, // センサーゾーンの幅
            sensorDepth: sensorDepth // センサーゾーンの奥行き
        });
    }
    
    createMovingPlatform(position, moveDistance, direction, color) {
        const platformSize = { width: 8, depth: 4, height: 0.4 };
        const platformGeometry = new THREE.BoxGeometry(platformSize.width, platformSize.height, platformSize.depth);
        const platformMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.1
        });
        
        const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.position.set(position.x, position.y, position.z);
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        this.sceneManager.scene.add(platformMesh);
        
        // 物理ボディ
        const platformShape = new CANNON.Box(new CANNON.Vec3(
            platformSize.width/2,
            platformSize.height/2,
            platformSize.depth/2
        ));
        const platformBody = new CANNON.Body({
            mass: 0,
            shape: platformShape,
            type: CANNON.Body.KINEMATIC
        });
        platformBody.position.copy(platformMesh.position);
        this.physicsManager.addBody(platformBody);
        
        // 移動プラットフォームデータ
        this.movingPlatforms.push({
            mesh: platformMesh,
            body: platformBody,
            startPos: { ...position },
            moveDistance: moveDistance,
            direction: direction, // 'horizontal' or 'vertical'
            speed: 3,
            phase: 0
        });
    }
    
    createBoostPad(position, rotation) {
        const padSize = { width: 4, depth: 8, height: 0.1 };
        
        // ビジュアル用のグループ
        const boostGroup = new THREE.Group();
        
        // ベースプレート
        const padGeometry = new THREE.BoxGeometry(padSize.width, padSize.height, padSize.depth);
        const padMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
            // Z-fighting対策
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const padMesh = new THREE.Mesh(padGeometry, padMaterial);
        const boostPadOffset = 0.005; // 0.5cm上にオフセット
        padMesh.position.y = -padSize.height/2 + boostPadOffset; // 地面より少し上
        padMesh.renderOrder = 2; // エレベーターより優先
        boostGroup.add(padMesh);
        
        // 矢印のビジュアル（地面レベルより少し上）
        for (let i = 0; i < 3; i++) {
            const arrowGeometry = new THREE.ConeGeometry(0.3, 1, 4);
            const arrowMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.7
            });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow.rotation.x = -Math.PI / 2;
            arrow.position.set(0, 0.05, -2 + i * 2); // 地面から5cm上
            boostGroup.add(arrow);
        }
        
        boostGroup.position.set(position.x, position.y, position.z);
        boostGroup.rotation.y = rotation;
        // グループ全体のレンダリング順序も設定
        boostGroup.renderOrder = 2;
        this.sceneManager.scene.add(boostGroup);
        
        // トリガーボディ（紙のように薄いセンサー）
        const triggerShape = new CANNON.Box(new CANNON.Vec3(padSize.width/2, 0.01, padSize.depth/2)); // 高さを2cmの薄い板に
        const triggerBody = new CANNON.Body({
            mass: 0,
            shape: triggerShape,
            isTrigger: true,
            collisionResponse: false // 衝突応答を無効化（通り抜け可能）
        });
        triggerBody.position.set(position.x, position.y + 0.02, position.z); // 地面から4cm上（薄い板の中心）
        triggerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
        this.physicsManager.addBody(triggerBody);
        
        this.boostPads.push({
            mesh: boostGroup,
            body: triggerBody,
            rotation: rotation,
            boostForce: 2000,     // Bruno Simon風に調整（楽しさ重視）
            cooldown: 0,
            maxCooldown: 1.5      // クールダウンも短く
        });
    }
    
    createJumpPad(position) {
        const padRadius = 2;
        
        // ビジュアル
        const jumpGroup = new THREE.Group();
        
        // ベース（円形）
        const baseGeometry = new THREE.CylinderGeometry(padRadius, padRadius, 0.2, 16);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.3,
            // Z-fighting対策
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        const jumpPadOffset = 0.005;
        baseMesh.position.y = -0.1 + jumpPadOffset; // 地面より少し上
        baseMesh.renderOrder = 2; // エレベーターより優先
        jumpGroup.add(baseMesh);
        
        // スプリングのビジュアル（地面レベル）
        const springGeometry = new THREE.TorusGeometry(padRadius * 0.7, 0.1, 8, 16);
        const springMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        for (let i = 0; i < 3; i++) {
            const spring = new THREE.Mesh(springGeometry, springMaterial);
            spring.position.y = 0.05 + i * 0.1; // 地面から少し上
            spring.scale.setScalar(1 - i * 0.2);
            jumpGroup.add(spring);
        }
        
        jumpGroup.position.set(position.x, position.y, position.z);
        // グループ全体のレンダリング順序も設定  
        jumpGroup.renderOrder = 2;
        this.sceneManager.scene.add(jumpGroup);
        
        // トリガーボディ
        const triggerShape = new CANNON.Cylinder(padRadius, padRadius, 0.5, 8);
        const triggerBody = new CANNON.Body({
            mass: 0,
            shape: triggerShape,
            isTrigger: true
        });
        triggerBody.position.set(position.x, position.y + 0.25, position.z);
        this.physicsManager.addBody(triggerBody);
        
        this.jumpPads.push({
            mesh: jumpGroup,
            body: triggerBody,
            jumpForce: 30000, // より強力なジャンプ力に増加
            cooldown: 0,
            maxCooldown: 1,
            animationTime: 0
        });
    }
    
    checkBoostPads(vehicleBody) {
        this.boostPads.forEach(pad => {
            if (pad.cooldown > 0) return;
            
            // XZ平面での距離を計算（Y軸を無視）
            const dx = vehicleBody.position.x - pad.body.position.x;
            const dz = vehicleBody.position.z - pad.body.position.z;
            const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
            
            // Y軸の差も確認（車が地面付近にいるか）
            const yDiff = Math.abs(vehicleBody.position.y - pad.body.position.y);
            
            // 水平距離が範囲内で、かつ車が低い位置にいる場合に発動
            if (horizontalDistance < 3 && yDiff < 2) {
                // ブースト方向を計算
                const boostDirection = new CANNON.Vec3(0, 0, -1);
                pad.body.quaternion.vmult(boostDirection, boostDirection);
                
                // ブースト力を適用
                const boostForce = boostDirection.scale(pad.boostForce);
                vehicleBody.applyLocalForce(boostForce, new CANNON.Vec3(0, 0, 0));
                
                pad.cooldown = pad.maxCooldown;
                
                // ビジュアルエフェクト
                pad.mesh.children[0].material.emissiveIntensity = 1;
                
                // デバッグログは削除（パフォーマンス向上のため）
            }
        });
    }
    
    checkElevatorSafety(elevator, vehicleBody) {
        if (!vehicleBody || elevator.direction >= 0) {
            // 車両がないか、エレベーターが上昇中の場合はチェック不要
            return false;
        }
        
        // エレベーターの現在位置
        const elevatorY = elevator.body.position.y;
        const elevatorBottomY = elevatorY - elevator.platformHeight/2;
        
        // 車両の位置
        const vehiclePos = vehicleBody.position;
        
        // 水平距離の計算（エレベーターの中心からの距離）
        const dx = Math.abs(vehiclePos.x - elevator.position.x);
        const dz = Math.abs(vehiclePos.z - elevator.position.z);
        
        // エレベーターのセンサーゾーン内かチェック（水平方向）
        const isInHorizontalRange = dx < elevator.sensorWidth/2 && dz < elevator.sensorDepth/2;
        
        // 垂直方向のチェック（エレベーター底面の下、センサーゾーン内）
        const vehicleTopY = vehiclePos.y + 1.0; // 車両の高さを考慮（概算）
        const sensorBottomY = elevatorBottomY - elevator.sensorHeight;
        
        // 車両がセンサーゾーン内にいるか
        const isInDangerZone = isInHorizontalRange && 
                              vehicleTopY >= sensorBottomY && 
                              vehicleTopY <= elevatorBottomY;
        
        // デバッグログは削除（パフォーマンス向上のため）
        
        return isInDangerZone;
    }
    
    checkJumpPads(vehicleBody) {
        this.jumpPads.forEach(pad => {
            if (pad.cooldown > 0) return;
            
            const distance = vehicleBody.position.vsub(pad.body.position).length();
            if (distance < 2.5) {
                // Bruno Simon風のジャンプ（軽い車体で楽しいジャンプ）
                const jumpImpulse = new CANNON.Vec3(0, 200, 0); // 軽い車体に合わせた力
                vehicleBody.applyImpulse(jumpImpulse, vehicleBody.position);
                
                // 上向きの速度も設定（楽しさ重視）
                vehicleBody.velocity.y = Math.max(vehicleBody.velocity.y, 12); // 適度な高さ
                
                pad.cooldown = pad.maxCooldown;
                pad.animationTime = 0.5;
                
                // デバッグログは削除（パフォーマンス向上のため）
            }
        });
    }
    
    updateGimmicks(deltaTime, vehicleBody) {
        // エレベーターの更新
        this.elevators.forEach(elevator => {
            // 安全チェック（下降中のみ）
            if (elevator.direction < 0 && vehicleBody) {
                const isSafetyNeeded = this.checkElevatorSafety(elevator, vehicleBody);
                
                if (isSafetyNeeded) {
                    elevator.safetyStop = true;
                    // 警告表示
                    if (this.uiManager) {
                        this.uiManager.showElevatorSafetyWarning(true);
                    }
                } else if (elevator.safetyStop) {
                    // 安全停止解除
                    elevator.safetyStop = false;
                    if (this.uiManager) {
                        this.uiManager.showElevatorSafetyWarning(false);
                    }
                }
            }
            
            // 待機時間の処理
            if (elevator.waitTimer > 0) {
                elevator.waitTimer -= deltaTime;
                // 待機中は速度を0に
                elevator.body.velocity.set(0, 0, 0);
                return;
            }
            
            // 安全停止中は移動しない
            if (elevator.safetyStop) {
                elevator.body.velocity.set(0, 0, 0);
                return;
            }
            
            // 移動量と速度の計算
            const moveAmount = elevator.speed * elevator.direction * deltaTime;
            const velocityY = elevator.speed * elevator.direction;
            
            // 位置を更新（メッシュとコリジョンを完全に同期）
            elevator.mesh.position.y += moveAmount;
            elevator.body.position.y = elevator.mesh.position.y; // メッシュの位置を確実にコピー
            
            // KINEMATICボディの速度を設定（物理エンジンに速度情報を伝える）
            // 注：車両への加速度付与は行わない。物理エンジンが自動的に処理する
            elevator.body.velocity.set(0, velocityY, 0);
            
            // デバッグ情報（オプション）
            if (Math.abs(moveAmount) > 0.001 && vehicleBody) {
                const dx = vehicleBody.position.x - elevator.body.position.x;
                const dz = vehicleBody.position.z - elevator.body.position.z;
                const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
                
                if (horizontalDistance < 3) { // エレベーターの範囲内
                    const vehicleBottomY = vehicleBody.position.y - 0.5; // 車両の底面（概算）
                    // エレベーターの上面 = ボディのY位置 + 高さの半分
                    const platformTopY = elevator.body.position.y + (elevator.platformHeight ? elevator.platformHeight / 2 : 0.25);
                    const yDiff = vehicleBottomY - platformTopY;
                    
                    // デバッグログは削除（パフォーマンス向上のため）
                }
            }
            
            // 境界チェック
            if (elevator.mesh.position.y >= elevator.maxY) {
                elevator.mesh.position.y = elevator.maxY;
                elevator.body.position.y = elevator.mesh.position.y; // メッシュの位置を確実にコピー
                elevator.body.velocity.set(0, 0, 0); // 停止時は速度を0に
                elevator.direction = -1;
                elevator.waitTimer = elevator.waitTime;
            } else if (elevator.mesh.position.y <= elevator.minY) {
                elevator.mesh.position.y = elevator.minY;
                elevator.body.position.y = elevator.mesh.position.y; // メッシュの位置を確実にコピー
                elevator.body.velocity.set(0, 0, 0); // 停止時は速度を0に
                elevator.direction = 1;
                elevator.waitTimer = elevator.waitTime;
            }
        });
        
        // 動く足場の更新
        this.movingPlatforms.forEach(platform => {
            platform.phase += deltaTime * platform.speed / platform.moveDistance;
            const offset = Math.sin(platform.phase * Math.PI) * platform.moveDistance;
            
            if (platform.direction === 'horizontal') {
                platform.mesh.position.x = platform.startPos.x + offset;
                platform.body.position.x = platform.startPos.x + offset;
            } else {
                platform.mesh.position.z = platform.startPos.z + offset;
                platform.body.position.z = platform.startPos.z + offset;
            }
        });
        
        // ブーストパッドの更新
        this.boostPads.forEach(pad => {
            if (pad.cooldown > 0) {
                pad.cooldown -= deltaTime;
                pad.mesh.children[0].material.emissiveIntensity = Math.max(0.5, pad.cooldown / pad.maxCooldown);
            }
        });
        
        // ジャンプパッドの更新
        this.jumpPads.forEach(pad => {
            if (pad.cooldown > 0) {
                pad.cooldown -= deltaTime;
            }
            
            // アニメーション
            if (pad.animationTime > 0) {
                pad.animationTime -= deltaTime;
                const scale = 1 + Math.sin(pad.animationTime * 10) * 0.2;
                pad.mesh.scale.y = scale;
            } else {
                pad.mesh.scale.y = 1;
            }
            
            // 回転アニメーション
            pad.mesh.rotation.y += deltaTime * 2;
        });
        
        // 車両との衝突チェック
        if (vehicleBody) {
            this.checkBoostPads(vehicleBody);
            this.checkJumpPads(vehicleBody);
        }
    }
    
    update(deltaTime, vehicleBody = null) {
        // 障害物の更新
        this.updateObstacles();
        
        // ギミックの更新
        this.updateGimmicks(deltaTime, vehicleBody);
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
        
        // ランプの削除
        this.ramps.forEach(ramp => {
            this.sceneManager.scene.remove(ramp.mesh);
            if (ramp.mesh.geometry) ramp.mesh.geometry.dispose();
            if (ramp.mesh.material) ramp.mesh.material.dispose();
            this.physicsManager.removeBody(ramp.body);
        });
        
        // 壁の削除
        this.walls.forEach(wall => {
            this.sceneManager.scene.remove(wall.mesh);
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
        this.ramps = [];
        
        // ギミックの削除
        this.elevators.forEach(elevator => {
            this.sceneManager.scene.remove(elevator.mesh);
            if (elevator.mesh.geometry) elevator.mesh.geometry.dispose();
            if (elevator.mesh.material) elevator.mesh.material.dispose();
            this.physicsManager.removeBody(elevator.body);
        });
        
        this.movingPlatforms.forEach(platform => {
            this.sceneManager.scene.remove(platform.mesh);
            if (platform.mesh.geometry) platform.mesh.geometry.dispose();
            if (platform.mesh.material) platform.mesh.material.dispose();
            this.physicsManager.removeBody(platform.body);
        });
        
        this.elevators = [];
        this.movingPlatforms = [];
        
        // ブーストパッドとジャンプパッドの削除
        this.boostPads.forEach(pad => {
            this.sceneManager.scene.remove(pad.mesh);
            this.physicsManager.removeBody(pad.body);
        });
        
        this.jumpPads.forEach(pad => {
            this.sceneManager.scene.remove(pad.mesh);
            this.physicsManager.removeBody(pad.body);
        });
        
        this.boostPads = [];
        this.jumpPads = [];
    }
}