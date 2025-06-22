// 入力処理管理モジュール
import * as CONFIG from './config.js';

export class InputManager {
    constructor() {
        this.keys = {};
        this.vehicleActions = {
            acceleration: false,
            braking: false,
            left: false,
            right: false,
            turbo: false,
            handbrake: false
        };
        this.callbacks = {
            onReset: null,
            onDebugToggle: null,
            onHelpToggle: null,
            onHeightAdjust: null,
            onSlopeAdjust: null,
            onCameraAdjust: null
        };
    }

    init() {
        // キーボードイベントリスナーの設定
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        // キーの状態を記録
        this.keys[event.code] = true;

        // 車両操作の更新
        if (CONFIG.KEY_MAPPINGS[event.code]) {
            const action = CONFIG.KEY_MAPPINGS[event.code];
            this.vehicleActions[action] = true;
        }

        // 特殊キーの処理
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.vehicleActions.turbo = true;
                break;
                
            case 'ShiftLeft':
            case 'ShiftRight':
                this.vehicleActions.handbrake = true;
                break;
                
            case 'KeyR':
                if (this.callbacks.onReset) {
                    this.callbacks.onReset();
                }
                break;
                
            case 'KeyC':
                if (this.callbacks.onDebugToggle) {
                    this.callbacks.onDebugToggle();
                }
                break;
                
            case 'KeyH':
                if (this.callbacks.onHelpToggle) {
                    this.callbacks.onHelpToggle();
                }
                break;
                
            case 'KeyQ':
                if (this.callbacks.onHeightAdjust) {
                    this.callbacks.onHeightAdjust(1);
                }
                break;
                
            case 'KeyE':
                if (this.callbacks.onHeightAdjust) {
                    this.callbacks.onHeightAdjust(-1);
                }
                break;
                
            case 'KeyO':
                if (this.callbacks.onSlopeAdjust) {
                    this.callbacks.onSlopeAdjust(1);
                }
                break;
                
            case 'KeyL':
                if (this.callbacks.onSlopeAdjust) {
                    this.callbacks.onSlopeAdjust(-1);
                }
                break;
                
            // カメラ調整（数字キー）
            case 'Digit1':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('distance', -1);
                }
                break;
                
            case 'Digit2':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('distance', 1);
                }
                break;
                
            case 'Digit3':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('height', -1);
                }
                break;
                
            case 'Digit4':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('height', 1);
                }
                break;
                
            case 'Digit5':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('sideOffset', -1);
                }
                break;
                
            case 'Digit6':
                if (this.callbacks.onCameraAdjust) {
                    this.callbacks.onCameraAdjust('sideOffset', 1);
                }
                break;
        }
    }

    onKeyUp(event) {
        // キーの状態をリセット
        this.keys[event.code] = false;

        // 車両操作の更新
        if (CONFIG.KEY_MAPPINGS[event.code]) {
            const action = CONFIG.KEY_MAPPINGS[event.code];
            this.vehicleActions[action] = false;
        }

        // 特殊キーの処理
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.vehicleActions.turbo = false;
                break;
                
            case 'ShiftLeft':
            case 'ShiftRight':
                this.vehicleActions.handbrake = false;
                break;
        }
    }

    // コールバック設定メソッド
    setCallback(name, callback) {
        if (this.callbacks.hasOwnProperty(name)) {
            this.callbacks[name] = callback;
        }
    }

    // 現在の入力状態を取得
    getVehicleActions() {
        return this.vehicleActions;
    }

    // 特定のキーが押されているかチェック
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    dispose() {
        // イベントリスナーの削除
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}