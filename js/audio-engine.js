// 高度な音響エンジンモジュール - プロシージャル音響生成
import * as CONFIG from './config.js';

/**
 * 音響パラメータープリセット
 * 各音響効果の詳細なパラメーターを定義
 */
export const AUDIO_PRESETS = {
    engine: {
        // エンジン音の基本設定
        idle: {
            baseFrequency: 80,
            harmonics: [1, 0.7, 0.5, 0.3, 0.2], // 倍音の振幅比
            modulation: {
                frequency: 5,
                depth: 3
            },
            noise: {
                amount: 0.1,
                filterFrequency: 200
            }
        },
        acceleration: {
            frequencyMultiplier: 2.5,
            harmonicShift: 0.2,
            noiseIncrease: 0.3
        },
        deceleration: {
            frequencyMultiplier: 0.8,
            harmonicShift: -0.1,
            noiseDecrease: 0.2
        }
    },
    
    turbo: {
        whineFrequency: 2000,
        whineResonance: 15,
        whooshNoise: {
            filterFrequency: 800,
            filterQ: 2
        }
    },
    
    collision: {
        impact: {
            frequency: 60,
            decay: 0.3,
            noiseAmount: 0.8
        },
        metal: {
            frequencies: [523, 659, 784], // C5, E5, G5
            decay: 0.5,
            detune: 20
        }
    },
    
    tire: {
        screech: {
            baseFrequency: 1200,
            modulation: 30,
            noiseAmount: 0.6
        },
        rolling: {
            baseFrequency: 100,
            speedMultiplier: 0.5
        }
    },
    
    environment: {
        wind: {
            noiseFilterFrequency: 400,
            speedMultiplier: 0.02
        }
    }
};

/**
 * 音響ノード生成クラス
 * 再利用可能な音響コンポーネントを生成
 */
class AudioNodeFactory {
    constructor(audioContext) {
        this.context = audioContext;
    }
    
    /**
     * ローパスフィルター付きノイズジェネレーター
     */
    createFilteredNoise(frequency = 1000, Q = 1) {
        const bufferSize = 2 * this.context.sampleRate;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.context.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = frequency;
        filter.Q.value = Q;
        
        whiteNoise.connect(filter);
        
        return { source: whiteNoise, filter, output: filter };
    }
    
    /**
     * 倍音付きオシレーター群
     */
    createHarmonicOscillators(baseFrequency, harmonics) {
        const oscillators = [];
        const gains = [];
        const merger = this.context.createChannelMerger(harmonics.length);
        
        harmonics.forEach((amplitude, index) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.frequency.value = baseFrequency * (index + 1);
            osc.type = index === 0 ? 'sawtooth' : 'sine';
            gain.gain.value = amplitude;
            
            osc.connect(gain);
            gain.connect(merger, 0, index);
            
            oscillators.push(osc);
            gains.push(gain);
        });
        
        return { oscillators, gains, output: merger };
    }
    
    /**
     * エンベロープジェネレーター
     */
    createEnvelope(attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.3) {
        const envelope = this.context.createGain();
        envelope.gain.value = 0;
        
        return {
            node: envelope,
            trigger: (time = this.context.currentTime) => {
                envelope.gain.cancelScheduledValues(time);
                envelope.gain.setValueAtTime(0, time);
                envelope.gain.linearRampToValueAtTime(1, time + attack);
                envelope.gain.linearRampToValueAtTime(sustain, time + attack + decay);
            },
            release: (time = this.context.currentTime) => {
                envelope.gain.cancelScheduledValues(time);
                envelope.gain.linearRampToValueAtTime(0, time + release);
            }
        };
    }
    
    /**
     * 変調オシレーター（LFO）
     */
    createLFO(frequency = 5, depth = 10) {
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();
        
        lfo.frequency.value = frequency;
        lfo.type = 'sine';
        lfoGain.gain.value = depth;
        
        lfo.connect(lfoGain);
        
        return { oscillator: lfo, gain: lfoGain, output: lfoGain };
    }
}

/**
 * エンジン音ジェネレーター
 */
class EngineSound {
    constructor(audioContext, nodeFactory, useAdvancedMode = true) {
        this.context = audioContext;
        this.factory = nodeFactory;
        this.isPlaying = false;
        this.useAdvancedMode = useAdvancedMode;
        
        this.setupNodes();
    }
    
    setupNodes() {
        if (this.useAdvancedMode) {
            this.setupNodesAdvanced();
        } else {
            this.setupNodesSimple();
        }
    }
    
    setupNodesSimple() {
        const preset = AUDIO_PRESETS.engine.idle;
        
        // シンプルモード：基本的な単一オシレーターのみ
        console.log('[シンプルモード] 単一オシレーターで初期化');
        
        // シンプルなエンジン音（単一のオシレーター）
        this.simpleOsc = this.context.createOscillator();
        this.simpleOsc.type = 'sawtooth';
        this.simpleOsc.frequency.value = preset.baseFrequency;
        
        // 軽いフィルター
        this.simpleFilter = this.context.createBiquadFilter();
        this.simpleFilter.type = 'lowpass';
        this.simpleFilter.frequency.value = 1000;
        this.simpleFilter.Q.value = 1;
        
        // エンジンの振動を表現するLFO
        this.vibrationLFO = this.factory.createLFO(
            preset.modulation.frequency,
            preset.modulation.depth * 0.5 // シンプルモードは控えめ
        );
        
        // 軽いノイズ
        this.noise = this.factory.createFilteredNoise(
            preset.noise.filterFrequency * 0.5
        );
        
        // ノイズ用ゲイン（シンプルモードは少なめ）
        this.noiseGain = this.context.createGain();
        this.noiseGain.gain.value = preset.noise.amount * 0.3;
        
        // マスターゲイン
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0;
        
        // 接続（シンプルな構成）
        this.simpleOsc.connect(this.simpleFilter);
        this.simpleFilter.connect(this.masterGain);
        this.noise.output.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        
        // LFOを周波数に接続
        this.vibrationLFO.output.connect(this.simpleOsc.frequency);
        
        // harmonic互換性のため（updateSpeedで使用）
        this.harmonic = {
            oscillators: [this.simpleOsc],
            output: this.simpleFilter
        };
    }
    
    setupNodesAdvanced() {
        const preset = AUDIO_PRESETS.engine.idle;
        
        // === 基本エンジン音（既存） ===
        this.harmonic = this.factory.createHarmonicOscillators(
            preset.baseFrequency,
            preset.harmonics
        );
        
        // エンジンの振動を表現するLFO
        this.vibrationLFO = this.factory.createLFO(
            preset.modulation.frequency,
            preset.modulation.depth
        );
        
        // === 排気音レイヤー ===
        // 低周波の脈動を表現
        this.exhaustPulse = this.context.createOscillator();
        this.exhaustPulse.type = 'sawtooth'; // より豊かな倍音
        this.exhaustPulse.frequency.value = 30; // 30Hz - 低い脈動
        
        this.exhaustFilter = this.context.createBiquadFilter();
        this.exhaustFilter.type = 'lowpass';
        this.exhaustFilter.frequency.value = 200;
        this.exhaustFilter.Q.value = 3;
        
        this.exhaustGain = this.context.createGain();
        this.exhaustGain.gain.value = 0.6; // より顕著に
        
        // 排気音のLFO（不規則な脈動）
        this.exhaustLFO = this.factory.createLFO(2, 5);
        
        // === 吸気音レイヤー ===
        // ターボ車特有のヒュー音
        this.intakeNoise = this.factory.createFilteredNoise(2000, 5);
        this.intakeGain = this.context.createGain();
        this.intakeGain.gain.value = 0;
        
        // === メカニカルノイズレイヤー ===
        // バルブやピストンの動作音
        this.mechanicalOsc = this.context.createOscillator();
        this.mechanicalOsc.type = 'square';
        this.mechanicalOsc.frequency.value = 150;
        
        this.mechanicalFilter = this.context.createBiquadFilter();
        this.mechanicalFilter.type = 'bandpass';
        this.mechanicalFilter.frequency.value = 800;
        this.mechanicalFilter.Q.value = 1;
        
        this.mechanicalGain = this.context.createGain();
        this.mechanicalGain.gain.value = 0.05;
        
        // === 共鳴音レイヤー ===
        // 車体共振をシミュレート
        this.resonanceOsc = this.context.createOscillator();
        this.resonanceOsc.type = 'triangle';
        this.resonanceOsc.frequency.value = 200;
        
        this.resonanceFilter = this.context.createBiquadFilter();
        this.resonanceFilter.type = 'bandpass';
        this.resonanceFilter.frequency.value = 400;
        this.resonanceFilter.Q.value = 10;
        
        this.resonanceGain = this.context.createGain();
        this.resonanceGain.gain.value = 0.1;
        
        // エンジンノイズ（既存）
        this.noise = this.factory.createFilteredNoise(
            preset.noise.filterFrequency
        );
        this.noiseGain = this.context.createGain();
        this.noiseGain.gain.value = preset.noise.amount;
        
        // マスターゲイン
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0;
        
        // === 接続 ===
        // 基本エンジン音
        this.harmonic.output.connect(this.masterGain);
        
        // 排気音
        this.exhaustPulse.connect(this.exhaustFilter);
        this.exhaustFilter.connect(this.exhaustGain);
        this.exhaustGain.connect(this.masterGain);
        this.exhaustLFO.output.connect(this.exhaustPulse.frequency);
        
        // 吸気音
        this.intakeNoise.output.connect(this.intakeGain);
        this.intakeGain.connect(this.masterGain);
        
        // メカニカルノイズ
        this.mechanicalOsc.connect(this.mechanicalFilter);
        this.mechanicalFilter.connect(this.mechanicalGain);
        this.mechanicalGain.connect(this.masterGain);
        
        // 共鳴音
        this.resonanceOsc.connect(this.resonanceFilter);
        this.resonanceFilter.connect(this.resonanceGain);
        this.resonanceGain.connect(this.masterGain);
        
        // ノイズ
        this.noise.output.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        
        // LFOを基本周波数に接続
        this.harmonic.oscillators.forEach(osc => {
            this.vibrationLFO.output.connect(osc.frequency);
        });
    }
    
    start() {
        if (this.isPlaying) return;
        
        const now = this.context.currentTime;
        
        if (this.useAdvancedMode) {
            // アドバンスドモードの起動
            console.log('[高度モード] 複数レイヤーを起動');
            this.harmonic.oscillators.forEach(osc => osc.start(now));
            this.vibrationLFO.oscillator.start(now);
            this.exhaustPulse.start(now);
            this.exhaustLFO.oscillator.start(now);
            this.intakeNoise.source.start(now);
            this.mechanicalOsc.start(now);
            this.resonanceOsc.start(now);
            this.noise.source.start(now);
        } else {
            // シンプルモードの起動
            console.log('[シンプルモード] 単一オシレーターを起動');
            this.simpleOsc.start(now);
            this.vibrationLFO.oscillator.start(now);
            this.noise.source.start(now);
        }
        
        // フェードイン
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(0.3, now + 0.5);
        
        this.isPlaying = true;
    }
    
    updateSpeed(speed, acceleration) {
        if (!this.isPlaying) return;
        
        const now = this.context.currentTime;
        const preset = AUDIO_PRESETS.engine;
        
        // 速度に基づく基本周波数の計算
        const speedFactor = 1 + (speed / 20);
        const targetFrequency = preset.idle.baseFrequency * speedFactor;
        
        // RPMシミュレーション（0-1の範囲）
        const rpm = Math.min(speed / 30, 1);
        
        // デバッグ情報（定期的に表示）
        if (Math.random() < 0.02) { // 2%の確率で表示（頻度を抑える）
            console.log(`[エンジン音] モード: ${this.useAdvancedMode ? '高度' : 'シンプル'}, 速度: ${speed.toFixed(1)}, RPM: ${(rpm * 100).toFixed(0)}%`);
        }
        
        // 加速/減速による周波数調整
        let frequencyMultiplier = 1;
        if (acceleration > 0) {
            frequencyMultiplier = preset.acceleration.frequencyMultiplier;
        } else if (acceleration < 0) {
            frequencyMultiplier = preset.deceleration.frequencyMultiplier;
        }
        
        // 各倍音の周波数を更新
        this.harmonic.oscillators.forEach((osc, index) => {
            const harmonicNumber = index + 1;
            const targetHarmonicFreq = targetFrequency * harmonicNumber * frequencyMultiplier;
            osc.frequency.setTargetAtTime(targetHarmonicFreq, now, 0.1);
        });
        
        if (this.useAdvancedMode) {
            // === アドバンスドモードの追加更新 ===
            
            // 排気音の更新（低回転で強く、高回転で弱く）
            const exhaustIntensity = Math.max(0.8 - rpm * 0.5, 0.2);
            this.exhaustGain.gain.setTargetAtTime(exhaustIntensity, now, 0.1);
            this.exhaustPulse.frequency.setTargetAtTime(25 + rpm * 25, now, 0.1);
            
            // 吸気音の更新（高回転で強く）
            const intakeIntensity = acceleration > 0 ? rpm * 0.6 : rpm * 0.2;
            this.intakeGain.gain.setTargetAtTime(intakeIntensity, now, 0.05);
            
            // メカニカルノイズの更新（RPMに比例）
            this.mechanicalOsc.frequency.setTargetAtTime(150 + rpm * 450, now, 0.1);
            this.mechanicalGain.gain.setTargetAtTime(0.1 + rpm * 0.15, now, 0.1);
            
            // 共鳴音の更新（特定RPM域で強く）
            const resonancePeak = Math.sin(rpm * Math.PI * 2) * 0.25;
            this.resonanceOsc.frequency.setTargetAtTime(200 + rpm * 400, now, 0.1);
            this.resonanceGain.gain.setTargetAtTime(Math.max(resonancePeak, 0), now, 0.1);
            
            // フィルター調整
            this.exhaustFilter.frequency.setTargetAtTime(150 + rpm * 150, now, 0.1);
            this.mechanicalFilter.frequency.setTargetAtTime(800 + rpm * 600, now, 0.1);
            this.resonanceFilter.frequency.setTargetAtTime(400 + rpm * 800, now, 0.1);
            
            // デバッグ：アドバンスドモード特有の情報
            if (Math.random() < 0.01) {
                console.log(`[高度モード] 排気: ${exhaustIntensity.toFixed(2)}, 吸気: ${intakeIntensity.toFixed(2)}, 共鳴: ${resonancePeak.toFixed(2)}`);
            }
        }
        
        // ノイズ量の調整
        const targetNoiseAmount = preset.idle.noise.amount + (speed / 100);
        this.noiseGain.gain.setTargetAtTime(targetNoiseAmount, now, 0.2);
        
        // ボリューム調整（速度が上がるとわずかに大きく）
        const baseVolume = this.useAdvancedMode ? 0.4 : 0.3; // 高度モードは少し大きめ
        const volumeFactor = baseVolume + (speed / 200);
        this.masterGain.gain.setTargetAtTime(volumeFactor, now, 0.1);
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        const now = this.context.currentTime;
        
        // フェードアウト
        this.masterGain.gain.setTargetAtTime(0, now, 0.3);
        
        // 少し遅れて停止
        setTimeout(() => {
            if (this.useAdvancedMode) {
                console.log('[高度モード] 全レイヤーを停止');
                this.harmonic.oscillators.forEach(osc => osc.stop());
                this.vibrationLFO.oscillator.stop();
                this.exhaustPulse.stop();
                this.exhaustLFO.oscillator.stop();
                this.intakeNoise.source.stop();
                this.mechanicalOsc.stop();
                this.resonanceOsc.stop();
                this.noise.source.stop();
            } else {
                console.log('[シンプルモード] オシレーターを停止');
                this.simpleOsc.stop();
                this.vibrationLFO.oscillator.stop();
                this.noise.source.stop();
            }
            this.isPlaying = false;
            
            // ノードを再作成（次回の再生のため）
            this.setupNodes();
        }, 500);
    }
    
    connect(destination) {
        this.masterGain.connect(destination);
    }
}

/**
 * ターボ音ジェネレーター
 */
class TurboSound {
    constructor(audioContext, nodeFactory) {
        this.context = audioContext;
        this.factory = nodeFactory;
        this.isActive = false;
        
        this.setupNodes();
    }
    
    setupNodes() {
        const preset = AUDIO_PRESETS.turbo;
        
        // ターボの高音（ホイーン音）
        this.whine = this.context.createOscillator();
        this.whine.type = 'sawtooth';
        this.whine.frequency.value = preset.whineFrequency;
        
        // レゾナンスフィルター
        this.resonanceFilter = this.context.createBiquadFilter();
        this.resonanceFilter.type = 'bandpass';
        this.resonanceFilter.frequency.value = preset.whineFrequency;
        this.resonanceFilter.Q.value = preset.whineResonance;
        
        // ウーシュ音（風切り音）
        this.whoosh = this.factory.createFilteredNoise(
            preset.whooshNoise.filterFrequency,
            preset.whooshNoise.filterQ
        );
        
        // ゲインノード
        this.whineGain = this.context.createGain();
        this.whineGain.gain.value = 0;
        
        this.whooshGain = this.context.createGain();
        this.whooshGain.gain.value = 0;
        
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.4;
        
        // 接続
        this.whine.connect(this.resonanceFilter);
        this.resonanceFilter.connect(this.whineGain);
        this.whineGain.connect(this.masterGain);
        
        this.whoosh.output.connect(this.whooshGain);
        this.whooshGain.connect(this.masterGain);
    }
    
    start() {
        if (this.isActive) return;
        
        const now = this.context.currentTime;
        
        // 新しいノードを作成
        this.setupNodes();
        
        this.whine.start(now);
        this.whoosh.source.start(now);
        
        // フェードイン
        this.whineGain.gain.setValueAtTime(0, now);
        this.whineGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
        
        this.whooshGain.gain.setValueAtTime(0, now);
        this.whooshGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        
        this.isActive = true;
    }
    
    stop() {
        if (!this.isActive) return;
        
        const now = this.context.currentTime;
        
        // フェードアウト
        this.whineGain.gain.linearRampToValueAtTime(0, now + 0.3);
        this.whooshGain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        setTimeout(() => {
            this.whine.stop();
            this.whoosh.source.stop();
            this.isActive = false;
        }, 400);
    }
    
    updateSpeed(speed) {
        if (!this.isActive) return;
        
        const now = this.context.currentTime;
        
        // 速度に応じてピッチを変更
        const pitchFactor = 1 + (speed / 40);
        this.whine.frequency.setTargetAtTime(
            AUDIO_PRESETS.turbo.whineFrequency * pitchFactor,
            now,
            0.1
        );
        this.resonanceFilter.frequency.setTargetAtTime(
            AUDIO_PRESETS.turbo.whineFrequency * pitchFactor,
            now,
            0.1
        );
    }
    
    connect(destination) {
        this.masterGain.connect(destination);
    }
}

/**
 * 衝突音ジェネレーター
 */
class CollisionSound {
    constructor(audioContext, nodeFactory) {
        this.context = audioContext;
        this.factory = nodeFactory;
    }
    
    play(intensity = 0.5) {
        const preset = AUDIO_PRESETS.collision;
        const now = this.context.currentTime;
        
        // 低音のインパクト音
        const impact = this.context.createOscillator();
        impact.type = 'sine';
        impact.frequency.value = preset.impact.frequency;
        
        // インパクトエンベロープ
        const impactEnv = this.factory.createEnvelope(0.001, preset.impact.decay, 0, 0);
        
        // 金属音（複数の周波数）
        const metalGains = [];
        preset.metal.frequencies.forEach(freq => {
            const osc = this.context.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq + (Math.random() * preset.metal.detune - preset.metal.detune/2);
            
            const gain = this.context.createGain();
            gain.gain.value = 0;
            
            osc.connect(gain);
            osc.start(now);
            osc.stop(now + preset.metal.decay);
            
            // エンベロープ
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2 * intensity, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + preset.metal.decay);
            
            metalGains.push(gain);
        });
        
        // ノイズバースト
        const noise = this.factory.createFilteredNoise(2000, 0.5);
        const noiseEnv = this.context.createGain();
        noiseEnv.gain.value = 0;
        
        // マスター出力
        const masterGain = this.context.createGain();
        masterGain.gain.value = intensity;
        
        // 接続
        impact.connect(impactEnv.node);
        impactEnv.node.connect(masterGain);
        
        metalGains.forEach(gain => gain.connect(masterGain));
        
        noise.output.connect(noiseEnv);
        noiseEnv.connect(masterGain);
        
        // 再生
        impact.start(now);
        impact.stop(now + 0.5);
        
        noise.source.start(now);
        noise.source.stop(now + 0.3);
        
        // インパクトエンベロープ
        impactEnv.trigger(now);
        
        // ノイズエンベロープ
        noiseEnv.gain.setValueAtTime(0, now);
        noiseEnv.gain.linearRampToValueAtTime(preset.impact.noiseAmount * intensity, now + 0.001);
        noiseEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        return masterGain;
    }
}

/**
 * タイヤ音ジェネレーター
 */
class TireSound {
    constructor(audioContext, nodeFactory) {
        this.context = audioContext;
        this.factory = nodeFactory;
        this.screechSound = null;
    }
    
    startScreech() {
        if (this.screechSound) return;
        
        const preset = AUDIO_PRESETS.tire.screech;
        const now = this.context.currentTime;
        
        // スクリーチ音のベース
        const screech = this.context.createOscillator();
        screech.type = 'sawtooth';
        screech.frequency.value = preset.baseFrequency;
        
        // 変調用LFO
        const modLFO = this.factory.createLFO(preset.modulation, preset.baseFrequency * 0.1);
        modLFO.oscillator.start(now);
        modLFO.output.connect(screech.frequency);
        
        // ハイパスフィルター
        const highpass = this.context.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 800;
        
        // ノイズ追加
        const noise = this.factory.createFilteredNoise(3000, 2);
        const noiseGain = this.context.createGain();
        noiseGain.gain.value = preset.noiseAmount;
        
        // マスターゲイン
        const masterGain = this.context.createGain();
        masterGain.gain.value = 0;
        
        // 接続
        screech.connect(highpass);
        highpass.connect(masterGain);
        
        noise.output.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        // 開始
        screech.start(now);
        noise.source.start(now);
        
        // フェードイン
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        
        this.screechSound = {
            oscillator: screech,
            lfo: modLFO,
            noise: noise,
            masterGain: masterGain
        };
        
        return masterGain;
    }
    
    stopScreech() {
        if (!this.screechSound) return;
        
        const now = this.context.currentTime;
        
        // フェードアウト
        this.screechSound.masterGain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        setTimeout(() => {
            this.screechSound.oscillator.stop();
            this.screechSound.lfo.oscillator.stop();
            this.screechSound.noise.source.stop();
            this.screechSound = null;
        }, 300);
    }
}

/**
 * 高度な音響管理システム
 */
export class AdvancedAudioManager {
    constructor() {
        this.context = null;
        this.nodeFactory = null;
        this.sounds = {};
        this.isInitialized = false;
        this.masterGain = null;
        this.effects = {};
        this.useAdvancedEngineMode = false; // デフォルトでシンプルモードを使用
    }
    
    async init() {
        if (this.isInitialized) return;
        
        // AudioContextの作成
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.nodeFactory = new AudioNodeFactory(this.context);
        
        // マスターボリューム
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.7;
        
        // エフェクトチェーンの作成
        this.createEffectsChain();
        
        // 各音響ジェネレーターの作成
        console.log(`[音響システム] エンジン音を${this.useAdvancedEngineMode ? '高度' : 'シンプル'}モードで初期化`);
        this.sounds.engine = new EngineSound(this.context, this.nodeFactory, this.useAdvancedEngineMode);
        this.sounds.turbo = new TurboSound(this.context, this.nodeFactory);
        this.sounds.collision = new CollisionSound(this.context, this.nodeFactory);
        this.sounds.tire = new TireSound(this.context, this.nodeFactory);
        
        // 接続
        this.sounds.engine.connect(this.effects.input);
        this.sounds.turbo.connect(this.effects.input);
        
        this.isInitialized = true;
        
        console.log('高度な音響システムが初期化されました');
    }
    
    createEffectsChain() {
        // コンプレッサー（音量の均一化）
        this.effects.compressor = this.context.createDynamicsCompressor();
        this.effects.compressor.threshold.value = -20;
        this.effects.compressor.knee.value = 10;
        this.effects.compressor.ratio.value = 8;
        this.effects.compressor.attack.value = 0.003;
        this.effects.compressor.release.value = 0.25;
        
        // リバーブ（空間の広がり）
        this.effects.convolver = this.context.createConvolver();
        this.createReverbImpulse();
        
        // リバーブ用のドライ/ウェットミキサー
        this.effects.dry = this.context.createGain();
        this.effects.dry.gain.value = 0.7;
        
        this.effects.wet = this.context.createGain();
        this.effects.wet.gain.value = 0.3;
        
        // エフェクトチェーンの入力
        this.effects.input = this.context.createGain();
        
        // 接続
        this.effects.input.connect(this.effects.compressor);
        this.effects.compressor.connect(this.effects.dry);
        this.effects.compressor.connect(this.effects.convolver);
        this.effects.convolver.connect(this.effects.wet);
        
        this.effects.dry.connect(this.masterGain);
        this.effects.wet.connect(this.masterGain);
        
        this.masterGain.connect(this.context.destination);
    }
    
    createReverbImpulse() {
        const length = this.context.sampleRate * 2;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.effects.convolver.buffer = impulse;
    }
    
    // 外部インターフェース
    startEngine() {
        if (!this.isInitialized) return;
        this.sounds.engine.start();
    }
    
    stopEngine() {
        if (!this.isInitialized) return;
        this.sounds.engine.stop();
    }
    
    updateEngineSpeed(speed, acceleration) {
        if (!this.isInitialized) return;
        this.sounds.engine.updateSpeed(speed, acceleration);
    }
    
    startTurbo() {
        if (!this.isInitialized) return;
        this.sounds.turbo.start();
    }
    
    stopTurbo() {
        if (!this.isInitialized) return;
        this.sounds.turbo.stop();
    }
    
    updateTurboSpeed(speed) {
        if (!this.isInitialized) return;
        this.sounds.turbo.updateSpeed(speed);
    }
    
    playCollision(intensity) {
        if (!this.isInitialized) return;
        const collisionGain = this.sounds.collision.play(intensity);
        collisionGain.connect(this.effects.input);
    }
    
    startTireScreech() {
        if (!this.isInitialized) return;
        const screechGain = this.sounds.tire.startScreech();
        screechGain.connect(this.effects.input);
    }
    
    stopTireScreech() {
        if (!this.isInitialized) return;
        this.sounds.tire.stopScreech();
    }
    
    setMasterVolume(volume) {
        if (!this.isInitialized) return;
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
    
    // AudioContextの再開（ユーザー操作後）
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
            console.log('AudioContext再開');
        }
    }
    
    // エンジン音モードの切り替え
    setEngineMode(useAdvanced) {
        if (this.useAdvancedEngineMode === useAdvanced) return;
        
        this.useAdvancedEngineMode = useAdvanced;
        
        console.log('=====================================');
        console.log(`🔊 エンジン音モード切替`);
        console.log(`旧モード: ${!useAdvanced ? '高度' : 'シンプル'}`);
        console.log(`新モード: ${useAdvanced ? '高度' : 'シンプル'}`);
        console.log('=====================================');
        
        // AudioContext の状態確認
        console.log(`[AudioEngine] AudioContext状態: ${this.context.state}`);
        if (this.context.state === 'suspended') {
            console.log('[AudioEngine] AudioContextがsuspended状態です。再開を試みます...');
            this.context.resume().then(() => {
                console.log('[AudioEngine] AudioContext再開成功');
            });
        }
        
        // モード切り替え音を再生（ビープ音）
        this.playModeChangeSound(useAdvanced);
        
        // エンジンが動作中の場合は再作成
        if (this.sounds.engine && this.sounds.engine.isPlaying) {
            console.log('エンジン音を再起動中...');
            this.sounds.engine.stop();
            setTimeout(() => {
                this.sounds.engine = new EngineSound(this.context, this.nodeFactory, this.useAdvancedEngineMode);
                this.sounds.engine.connect(this.effects.input);
                this.sounds.engine.start();
                console.log('エンジン音再起動完了');
            }, 600);
        } else if (this.sounds.engine) {
            this.sounds.engine = new EngineSound(this.context, this.nodeFactory, this.useAdvancedEngineMode);
            this.sounds.engine.connect(this.effects.input);
        }
    }
    
    // モード切り替え音
    playModeChangeSound(isAdvanced) {
        console.log('[Audio] playModeChangeSound呼び出し開始');
        console.log('[Audio] AudioContext状態:', this.context.state);
        console.log('[Audio] マスターゲイン値:', this.masterGain.gain.value);
        
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        const frequency = isAdvanced ? 880 : 440; // A5 or A4
        osc.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.5, now); // 音量を0.2から0.5に増加
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        console.log(`[Audio] ビープ音設定 - 周波数: ${frequency}Hz, 音量: 0.5`);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
        
        console.log('[Audio] ビープ音を開始しました');
    }
}