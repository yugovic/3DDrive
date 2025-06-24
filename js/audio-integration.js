// 音響システム統合モジュール
// 高度な音響エンジンを既存のゲームシステムに統合

import { AdvancedAudioManager, setAudioEngineDebugLogging } from './audio-engine.js';
import * as CONFIG from './config.js';

// グローバルデバッグフラグ
let AUDIO_DEBUG_LOGGING = false;

export function setAudioDebugLogging(enabled) {
    AUDIO_DEBUG_LOGGING = enabled;
    // audio-engine.jsのデバッグフラグも連動
    setAudioEngineDebugLogging(enabled);
}

/**
 * 音響管理統合クラス
 * 既存のゲームロジックと新しい音響エンジンを接続
 */
export class AudioIntegration {
    constructor() {
        this.audioManager = new AdvancedAudioManager();
        this.isEnabled = true;
        this.isEngineRunning = false;
        this.currentSpeed = 0;
        this.currentAcceleration = 0;
        this.isTurboActive = false;
        this.isDrifting = false;
        
        // デバッグモード
        this.debugMode = false;
        
        // 音響設定（将来の拡張用）
        this.settings = {
            engineVolume: 0.7,
            effectsVolume: 0.8,
            masterVolume: 0.8,
            reverbAmount: 0.3
        };
        
        // 車種スペック
        this.vehicleSpec = null;
    }
    
    /**
     * 車種スペックの設定
     * @param {Object} vehicleSpec - 車種スペック
     */
    setVehicleSpec(vehicleSpec) {
        this.vehicleSpec = vehicleSpec;
        if (vehicleSpec && vehicleSpec.audio) {
            const audioConfig = vehicleSpec.audio;
            
            // エンジンモードの設定
            const useAdvancedMode = audioConfig.engine.mode === 'advanced';
            if (AUDIO_DEBUG_LOGGING) {
                console.log(`[AudioIntegration] 車種別音響設定: ${vehicleSpec.info.name} - モード: ${audioConfig.engine.mode}`);
            }
            this.audioManager.setEngineMode(useAdvancedMode);
            
            // 将来の拡張用: エンジンタイプ別の音響パラメータ設定
            // this.audioManager.setEngineType(audioConfig.engine.type);
            // this.audioManager.setBaseFrequency(audioConfig.engine.baseFrequency);
            // this.audioManager.setHarmonics(audioConfig.engine.harmonics);
        }
    }
    
    /**
     * 初期化
     */
    async init() {
        try {
            await this.audioManager.init();
            if (AUDIO_DEBUG_LOGGING) {
                console.log('音響システム統合完了');
                console.log(`[音響システム] 初期エンジンモード: ${this.audioManager.useAdvancedEngineMode ? '高度' : 'シンプル'}`);
            }
            
            // ユーザー操作でAudioContextを再開
            this.setupUserInteraction();
            
            return true;
        } catch (error) {
            console.error('音響システムの初期化に失敗:', error);
            return false;
        }
    }
    
    /**
     * ユーザー操作によるAudioContext再開の設定
     */
    setupUserInteraction() {
        const resumeAudio = async () => {
            await this.audioManager.resume();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
    }
    
    /**
     * エンジン音の開始
     */
    startEngine() {
        if (!this.isEnabled || this.isEngineRunning) return;
        
        this.audioManager.startEngine();
        this.isEngineRunning = true;
        
        if (AUDIO_DEBUG_LOGGING) {
            console.log('エンジン音開始');
        }
    }
    
    /**
     * エンジン音の停止
     */
    stopEngine() {
        if (!this.isEngineRunning) return;
        
        this.audioManager.stopEngine();
        this.isEngineRunning = false;
        
        if (AUDIO_DEBUG_LOGGING) {
            console.log('エンジン音停止');
        }
    }
    
    /**
     * 車両状態の更新
     * @param {Object} vehicleState - 車両の状態
     */
    updateVehicleState(vehicleState) {
        if (!this.isEnabled || !this.isEngineRunning) return;
        
        const { speed, acceleration, isTurbo, isDrifting } = vehicleState;
        
        // エンジン音の更新
        this.audioManager.updateEngineSpeed(speed, acceleration);
        
        // ターボ音の制御
        if (isTurbo && !this.isTurboActive) {
            this.audioManager.startTurbo();
            this.isTurboActive = true;
        } else if (!isTurbo && this.isTurboActive) {
            this.audioManager.stopTurbo();
            this.isTurboActive = false;
        }
        
        if (isTurbo) {
            this.audioManager.updateTurboSpeed(speed);
        }
        
        // タイヤスクリーチ音の制御
        if (isDrifting && !this.isDrifting) {
            this.audioManager.startTireScreech();
            this.isDrifting = true;
        } else if (!isDrifting && this.isDrifting) {
            this.audioManager.stopTireScreech();
            this.isDrifting = false;
        }
        
        // 状態を保存
        this.currentSpeed = speed;
        this.currentAcceleration = acceleration;
    }
    
    /**
     * 衝突音の再生
     * @param {number} impactForce - 衝突の強さ (0-1)
     */
    playCollision(impactForce = 0.5) {
        if (!this.isEnabled) return;
        
        this.audioManager.playCollision(impactForce);
        
        if (AUDIO_DEBUG_LOGGING) {
            console.log(`衝突音再生: 強度 ${impactForce}`);
        }
    }
    
    /**
     * アイテム取得音の再生
     * （将来の拡張用 - audio-engine.jsに追加可能）
     */
    playItemCollect() {
        if (!this.isEnabled) return;
        
        // 簡易的な音を生成
        const context = this.audioManager.context;
        if (!context) return;
        
        const now = context.currentTime;
        
        // 上昇音
        const osc = context.createOscillator();
        const gain = context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.linearRampToValueAtTime(1047, now + 0.2); // C6
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioManager.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }
    
    /**
     * 音量設定
     */
    setMasterVolume(volume) {
        this.settings.masterVolume = volume;
        this.audioManager.setMasterVolume(volume * this.settings.masterVolume);
    }
    
    /**
     * ミュート切替
     */
    toggleMute() {
        this.isEnabled = !this.isEnabled;
        
        if (!this.isEnabled) {
            this.stopEngine();
            if (this.isTurboActive) {
                this.audioManager.stopTurbo();
                this.isTurboActive = false;
            }
            if (this.isDrifting) {
                this.audioManager.stopTireScreech();
                this.isDrifting = false;
            }
        } else if (this.isEngineRunning) {
            this.startEngine();
        }
        
        return this.isEnabled;
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            isEngineRunning: this.isEngineRunning,
            currentSpeed: this.currentSpeed.toFixed(1),
            currentAcceleration: this.currentAcceleration.toFixed(1),
            isTurboActive: this.isTurboActive,
            isDrifting: this.isDrifting,
            audioContextState: this.audioManager.context?.state || 'not initialized'
        };
    }
    
    /**
     * エンジン音モードの切り替え
     */
    toggleEngineMode() {
        if (AUDIO_DEBUG_LOGGING) {
            console.log('[AudioIntegration] toggleEngineMode開始');
            console.log('[AudioIntegration] AudioContext状態:', this.audioManager.context?.state);
        }
        
        // AudioContextがサスペンド状態の場合は再開
        if (this.audioManager.context?.state === 'suspended') {
            if (AUDIO_DEBUG_LOGGING) {
                console.log('[AudioIntegration] AudioContextがサスペンド状態です。再開を試みます...');
            }
            this.audioManager.context.resume().then(() => {
                if (AUDIO_DEBUG_LOGGING) {
                    console.log('[AudioIntegration] AudioContextを再開しました');
                }
            });
        }
        
        const currentMode = this.audioManager.useAdvancedEngineMode;
        const newMode = !currentMode;
        if (AUDIO_DEBUG_LOGGING) {
            console.log(`[toggleEngineMode] 現在: ${currentMode ? '高度' : 'シンプル'} → 新規: ${newMode ? '高度' : 'シンプル'}`);
        }
        this.audioManager.setEngineMode(newMode);
        return newMode;
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        this.stopEngine();
        if (this.isTurboActive) {
            this.audioManager.stopTurbo();
        }
        if (this.isDrifting) {
            this.audioManager.stopTireScreech();
        }
        
        // AudioContextのクローズは通常不要（ブラウザが管理）
        if (AUDIO_DEBUG_LOGGING) {
            console.log('音響システムをクリーンアップしました');
        }
    }
}

// シングルトンインスタンスとしてエクスポート
export const audioIntegration = new AudioIntegration();