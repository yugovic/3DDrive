// メインゲームループと統合モジュール
import * as CONFIG from './config.js';
import { SceneManager } from './scene.js';
import { PhysicsManager } from './physics.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { VehicleManager } from './vehicle.js';
import { TerrainManager } from './terrain.js';
import { ItemManager } from './items.js';

export class Game {
    constructor() {
        // マネージャーのインスタンス
        this.sceneManager = null;
        this.physicsManager = null;
        this.inputManager = null;
        this.uiManager = null;
        this.vehicleManager = null;
        this.terrainManager = null;
        this.itemManager = null;
        
        // ゲーム状態
        this.isRunning = false;
        this.lastTime = 0;
        this.selectedCarModel = null;
    }

    async init(selectedCar = null) {
        try {
            // 選択された車種のモデルパスを取得
            if (selectedCar && CONFIG.CAR_MODELS[selectedCar]) {
                this.selectedCarModel = CONFIG.CAR_MODELS[selectedCar].fallbackUrl || 
                                       CONFIG.CAR_MODELS[selectedCar].url;
            }

            // 各マネージャーの初期化
            console.log('初期化開始: SceneManager');
            this.sceneManager = new SceneManager();
            this.sceneManager.init();
            
            console.log('初期化開始: PhysicsManager');
            this.physicsManager = new PhysicsManager();
            this.physicsManager.init();
            
            console.log('初期化開始: InputManager');
            this.inputManager = new InputManager();
            this.inputManager.init();
            
            console.log('初期化開始: UIManager');
            this.uiManager = new UIManager();
            this.uiManager.init();

            // 地形マネージャーの作成と初期化
            console.log('初期化開始: TerrainManager');
            this.terrainManager = new TerrainManager(this.physicsManager, this.sceneManager);
            this.terrainManager.createTerrain();

            // 車両マネージャーの作成と初期化
            console.log('初期化開始: VehicleManager');
            this.vehicleManager = new VehicleManager(this.physicsManager, this.sceneManager);
            await this.vehicleManager.createVehicle(this.selectedCarModel);

            // アイテムマネージャーの作成と初期化
            console.log('初期化開始: ItemManager');
            this.itemManager = new ItemManager(this.sceneManager, this.uiManager);
            this.itemManager.init();

            // 入力コールバックの設定
            this.setupInputCallbacks();

            // UIの初期設定
            this.uiManager.showInstructions(true);
            this.uiManager.showLoading(false);

            // ゲーム開始
            console.log('ゲーム開始');
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        } catch (error) {
            console.error('ゲーム初期化エラー:', error);
            console.error('エラースタック:', error.stack);
            throw error;
        }
    }

    setupInputCallbacks() {
        // 車両リセット
        this.inputManager.setCallback('onReset', () => {
            this.vehicleManager.reset();
            this.uiManager.showMessage('車両をリセットしました');
        });

        // デバッグ表示切替
        this.inputManager.setCallback('onDebugToggle', () => {
            const debugMode = !this.physicsManager.debugMode;
            this.physicsManager.setDebugMode(debugMode, this.sceneManager.scene);
            this.uiManager.showDebugInfo(debugMode);
            this.uiManager.showMessage(`物理デバッグ表示: ${debugMode ? 'ON' : 'OFF'}`, 2000);
        });

        // バウンディングボックス表示切替
        this.inputManager.setCallback('onBoundingBoxToggle', () => {
            this.vehicleManager.showBoundingBox = !this.vehicleManager.showBoundingBox;
            if (this.vehicleManager.boundingBoxHelper) {
                this.vehicleManager.boundingBoxHelper.visible = this.vehicleManager.showBoundingBox;
            }
            this.uiManager.showMessage(`3Dモデル境界表示: ${this.vehicleManager.showBoundingBox ? 'ON' : 'OFF'}`, 2000);
        });

        // ヘルプ表示切替
        this.inputManager.setCallback('onHelpToggle', () => {
            const helpVisible = this.uiManager.elements.instructions.style.display === 'block';
            this.uiManager.showInstructions(!helpVisible);
        });

        // 車高調整
        this.inputManager.setCallback('onHeightAdjust', (delta) => {
            // 車高調整機能（必要に応じて実装）
            console.log('車高調整:', delta);
        });

        // スロープ角度調整
        this.inputManager.setCallback('onSlopeAdjust', (delta) => {
            this.terrainManager.adjustSlopeHeight(delta);
            this.uiManager.showMessage(`スロープ高さ: ${this.terrainManager.slopeHeight.toFixed(1)}m`, 1000);
        });

        // カメラ調整
        this.inputManager.setCallback('onCameraAdjust', (type, delta) => {
            const adjustments = this.sceneManager.camera.userData.adjustments || CONFIG.CAMERA.adjustments;
            switch (type) {
                case 'distance':
                    adjustments.distance = Math.max(5, Math.min(30, adjustments.distance + delta));
                    break;
                case 'height':
                    adjustments.height = Math.max(2, Math.min(20, adjustments.height + delta));
                    break;
                case 'sideOffset':
                    adjustments.sideOffset = Math.max(-10, Math.min(10, adjustments.sideOffset + delta));
                    break;
            }
            this.sceneManager.camera.userData.adjustments = adjustments;
            this.uiManager.showMessage(`カメラ ${type}: ${adjustments[type].toFixed(1)}`, 1000);
        });

        // ボディ高さ調整（デバッグ機能）
        this.inputManager.setCallback('onBodyHeightAdjust', (delta) => {
            if (this.vehicleManager) {
                console.warn(`[デバッグ] 高さ調整キーが押されました: ${delta > 0 ? '9キー(上昇)' : '0キー(下降)'}`);
                
                const newClearance = this.vehicleManager.adjustHeight(delta);
                
                this.uiManager.showMessage(
                    `車高クリアランス: ${newClearance.toFixed(2)}m (${delta > 0 ? '+' : ''}${delta}m)`, 
                    1500
                );
            }
        });
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 最大0.1秒
        this.lastTime = currentTime;

        // 物理シミュレーション更新
        this.physicsManager.update(deltaTime);

        // 車両更新
        const inputActions = this.inputManager.getVehicleActions();
        this.vehicleManager.update(inputActions, deltaTime);
        this.vehicleManager.syncMeshWithBody();

        // 地形更新
        this.terrainManager.update(deltaTime);

        // アイテム更新
        const vehiclePosition = this.vehicleManager.getPosition();
        this.itemManager.update(vehiclePosition);

        // カメラ追従
        if (this.vehicleManager.chassisBody) {
            const adjustments = this.sceneManager.camera.userData.adjustments || CONFIG.CAMERA.adjustments;
            this.sceneManager.updateCameraPosition(this.vehicleManager.chassisBody, adjustments);
        }

        // UI更新
        this.updateUI(deltaTime);

        // レンダリング
        this.sceneManager.render();
    }

    updateUI(deltaTime) {
        // 速度表示
        const speed = this.vehicleManager.getSpeed();
        this.uiManager.updateSpeed(speed);

        // ターボ表示
        const isTurboActive = this.inputManager.getVehicleActions().turbo;
        this.uiManager.showTurbo(isTurboActive);

        // デバッグ情報
        if (this.physicsManager.debugMode) {
            const debugInfo = {
                position: this.vehicleManager.getPosition(),
                speed: speed,
                fps: 1 / deltaTime,
                physics: {
                    bodies: this.physicsManager.world.bodies.length
                },
                custom: {
                    'アイテム': `${this.itemManager.getCollectedCount()} / ${this.itemManager.getTotalCount()}`,
                    'ターボ': isTurboActive ? 'ON' : 'OFF'
                }
            };
            this.uiManager.updateDebugInfo(debugInfo);
        }
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        }
    }

    dispose() {
        this.isRunning = false;

        // 各マネージャーの破棄
        if (this.itemManager) this.itemManager.dispose();
        if (this.vehicleManager) this.vehicleManager.dispose();
        if (this.terrainManager) this.terrainManager.dispose();
        if (this.inputManager) this.inputManager.dispose();
        if (this.uiManager) this.uiManager.dispose();
        if (this.physicsManager) this.physicsManager.dispose();
        if (this.sceneManager) this.sceneManager.dispose();
    }
}