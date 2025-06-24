// 入力処理管理モジュール
import * as CONFIG from './config.js';

export class InputManager {
    constructor() {
        this.isInitialized = false;
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
            onCameraAdjust: null,
            onBoundingBoxToggle: null,
            onBodyHeightAdjust: null,
            onMuteToggle: null,
            onEngineModeToggle: null,
            onDebugLogToggle: null  // デバッグログ切替用
        };
    }

    init() {
        // キーボードイベントリスナーの設定
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.isInitialized = true;
        console.log('[InputManager] 初期化完了');
    }

    onKeyDown(event) {
        // キーの状態を記録
        this.keys[event.code] = true;
        
        // デバッグ用：全キー入力のログ（開発中）
        // console.log(`[Key Debug] 押されたキー: ${event.code} (${event.key})`);
        // if (event.code === 'Digit9' || event.code === 'Digit0') {
        //     console.log(`[Key Debug] 9/0キー検出！コード: ${event.code}`);
        // }

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
                
            case 'KeyB':
                if (this.callbacks.onBoundingBoxToggle) {
                    this.callbacks.onBoundingBoxToggle();
                }
                break;
                
            case 'KeyD':
                // Ctrl+D でデバッグログ切替
                if (event.ctrlKey && this.callbacks.onDebugLogToggle) {
                    event.preventDefault(); // ブラウザのデフォルト動作を防ぐ
                    this.callbacks.onDebugLogToggle();
                }
                break;
                
            case 'KeyH':
                if (this.callbacks.onHelpToggle) {
                    this.callbacks.onHelpToggle();
                }
                break;
                
            case 'KeyM':
                // console.log('[Input] Mキーが押されました');
                if (this.callbacks.onMuteToggle) {
                    this.callbacks.onMuteToggle();
                } else {
                    // console.warn('[Input] onMuteToggleコールバックが設定されていません');
                }
                break;
                
            case 'KeyN':
                // 車種選択画面が表示されている場合は無視
                const carSelectionModal = document.getElementById('car-selection-modal');
                if (carSelectionModal && carSelectionModal.style.display !== 'none') {
                    // console.log('[Input Debug] 車種選択画面表示中のため、Nキーを無視します');
                    return;
                }
                
                // console.log('[Input Debug] Nキーが押されました！');
                // console.log('[Input Debug] callbacks全体:', this.callbacks);
                // console.log('[Input Debug] onEngineModeToggle:', this.callbacks.onEngineModeToggle);
                if (this.callbacks.onEngineModeToggle) {
                    // console.log('[Input Debug] onEngineModeToggleコールバックを実行します');
                    this.callbacks.onEngineModeToggle();
                } else {
                    // console.warn('[Input Debug] onEngineModeToggleコールバックが設定されていません！');
                    // console.warn('[Input Debug] ゲームが開始されていない可能性があります');
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
                
            case 'Digit9':
                console.log('[Input] 9キーが押されました');
                if (this.callbacks.onBodyHeightAdjust) {
                    console.log('[Input] onBodyHeightAdjustコールバックを呼び出します（+0.1）');
                    this.callbacks.onBodyHeightAdjust(0.1); // 10cm上げる
                } else {
                    console.warn('[Input] onBodyHeightAdjustコールバックが設定されていません');
                }
                break;
                
            case 'Digit0':
                console.log('[Input] 0キーが押されました');
                if (this.callbacks.onBodyHeightAdjust) {
                    console.log('[Input] onBodyHeightAdjustコールバックを呼び出します（-0.1）');
                    this.callbacks.onBodyHeightAdjust(-0.1); // 10cm下げる
                } else {
                    console.warn('[Input] onBodyHeightAdjustコールバックが設定されていません');
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