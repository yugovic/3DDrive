// アイテムシステムモジュール
import * as CONFIG from './config.js';
import { audioIntegration } from './audio-integration.js';

export class ItemManager {
    constructor(sceneManager, uiManager) {
        this.sceneManager = sceneManager;
        this.uiManager = uiManager;
        
        this.items = [];
        this.collectedItems = [];
        this.itemGeometry = null;
        this.itemMaterials = {};
        
        this.clock = new THREE.Clock();
    }

    init() {
        // アイテム用のジオメトリを事前に作成（パフォーマンス最適化）
        this.itemGeometry = new THREE.SphereGeometry(0.5, 16, 8);
        
        // アイテムの初期配置
        this.createInitialItems();
    }

    createInitialItems() {
        const itemCount = 25;
        
        // 内側の円に配置
        const innerRadius = 15;
        const innerCount = Math.floor(itemCount * 0.4);
        
        for (let i = 0; i < innerCount; i++) {
            const angle = (i / innerCount) * Math.PI * 2;
            const position = {
                x: Math.cos(angle) * innerRadius + (Math.random() - 0.5) * 5,
                y: CONFIG.ITEMS.floatHeight,
                z: Math.sin(angle) * innerRadius + (Math.random() - 0.5) * 5
            };
            this.createItem(position);
        }
        
        // 外側の円に配置
        const outerRadius = 35;
        const outerCount = itemCount - innerCount;
        
        for (let i = 0; i < outerCount; i++) {
            const angle = (i / outerCount) * Math.PI * 2;
            const position = {
                x: Math.cos(angle) * outerRadius + (Math.random() - 0.5) * 5,
                y: CONFIG.ITEMS.floatHeight,
                z: Math.sin(angle) * outerRadius + (Math.random() - 0.5) * 5
            };
            this.createItem(position);
        }
    }

    createItem(position) {
        // ランダムなアイテムタイプを選択
        const itemType = CONFIG.ITEMS.types[Math.floor(Math.random() * CONFIG.ITEMS.types.length)];
        
        // アイテムのメッシュを作成（透明な球）
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
            emissive: new THREE.Color().setHSL(Math.random(), 0.8, 0.3),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0,  // 完全に透明
            visible: false  // 非表示にする
        });
        
        const mesh = new THREE.Mesh(this.itemGeometry, material);
        mesh.position.copy(position);
        mesh.castShadow = false;  // 透明なので影も不要
        mesh.receiveShadow = false;
        
        // 絵文字を表示するためのスプライト
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.font = '100px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(itemType, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            sizeAttenuation: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 2, 1);
        sprite.position.copy(position);
        sprite.position.y += 1;
        
        // シーンに追加（メッシュは非表示だが、当たり判定用に追加）
        this.sceneManager.scene.add(mesh);
        this.sceneManager.scene.add(sprite);
        
        // アイテムデータを保存
        this.items.push({
            mesh: mesh,
            sprite: sprite,
            type: itemType,
            position: position,
            collected: false,
            floatOffset: Math.random() * Math.PI * 2
        });
    }

    update(vehiclePosition) {
        const time = this.clock.getElapsedTime();
        
        this.items.forEach((item, index) => {
            if (item.collected) return;
            
            // 浮遊アニメーション
            const floatY = CONFIG.ITEMS.floatHeight + 
                Math.sin(time * CONFIG.ITEMS.floatSpeed + item.floatOffset) * CONFIG.ITEMS.floatAmplitude;
            item.mesh.position.y = floatY;
            item.sprite.position.y = floatY + 1;
            
            // 回転アニメーション
            item.mesh.rotation.y = time * CONFIG.ITEMS.rotationSpeed;
            
            // 収集判定
            if (vehiclePosition) {
                const distance = item.mesh.position.distanceTo(vehiclePosition);
                if (distance < CONFIG.ITEMS.collectRadius) {
                    this.collectItem(index);
                }
            }
        });
    }

    collectItem(index) {
        const item = this.items[index];
        if (item.collected) return;
        
        item.collected = true;
        
        // 収集エフェクト
        this.createCollectEffect(item.position);
        
        // 収集音を再生
        audioIntegration.playItemCollect();
        
        // メッシュとスプライトを削除
        this.sceneManager.scene.remove(item.mesh);
        this.sceneManager.scene.remove(item.sprite);
        if (item.mesh.geometry && item.mesh.geometry !== this.itemGeometry) {
            item.mesh.geometry.dispose();
        }
        if (item.mesh.material) {
            item.mesh.material.dispose();
        }
        if (item.sprite.material.map) {
            item.sprite.material.map.dispose();
        }
        item.sprite.material.dispose();
        
        // 収集アイテムリストに追加（最大3個まで）
        if (this.collectedItems.length < CONFIG.ITEMS.maxCollected) {
            this.collectedItems.push(item.type);
        } else {
            // 最も古いアイテムを削除して新しいアイテムを追加
            this.collectedItems.shift();
            this.collectedItems.push(item.type);
        }
        
        // UI更新
        this.uiManager.updateCollectedItems(this.collectedItems);
        this.uiManager.showMessage(`${item.type} を獲得！`, 1500);
    }

    createCollectEffect(position) {
        // パーティクルエフェクト
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.7),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // ランダムな速度を設定
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10 + 5,
                (Math.random() - 0.5) * 10
            );
            
            this.sceneManager.scene.add(particle);
            particles.push(particle);
        }
        
        // パーティクルアニメーション
        const startTime = Date.now();
        const animateParticles = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            if (elapsed > 1) {
                // パーティクルを削除
                particles.forEach(particle => {
                    this.sceneManager.scene.remove(particle);
                    if (particle.geometry) particle.geometry.dispose();
                    if (particle.material) particle.material.dispose();
                });
                return;
            }
            
            particles.forEach(particle => {
                // 位置更新
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                particle.velocity.y -= 20 * 0.016; // 重力
                
                // フェードアウト
                particle.material.opacity = 1 - elapsed;
                
                // 回転
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;
            });
            
            requestAnimationFrame(animateParticles);
        };
        animateParticles();
    }

    getCollectedCount() {
        return this.items.filter(item => item.collected).length;
    }

    getTotalCount() {
        return this.items.length;
    }

    reset() {
        // すべてのアイテムをリセット
        this.items.forEach(item => {
            if (item.collected) {
                item.collected = false;
                item.mesh.position.copy(item.position);
                item.sprite.position.copy(item.position);
                item.sprite.position.y += 1;
                this.sceneManager.scene.add(item.mesh);
                this.sceneManager.scene.add(item.sprite);
            }
        });
        
        this.collectedItems = [];
        this.uiManager.updateCollectedItems(this.collectedItems);
    }

    dispose() {
        // すべてのアイテムを削除
        this.items.forEach(item => {
            this.sceneManager.scene.remove(item.mesh);
            this.sceneManager.scene.remove(item.sprite);
            if (item.mesh.material) item.mesh.material.dispose();
            if (item.sprite.material.map) item.sprite.material.map.dispose();
            item.sprite.material.dispose();
        });
        
        // 共有ジオメトリの削除
        if (this.itemGeometry) {
            this.itemGeometry.dispose();
        }
        
        this.items = [];
        this.collectedItems = [];
    }
}