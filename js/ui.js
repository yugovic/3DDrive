// UI管理モジュール
import * as CONFIG from './config.js';

export class UIManager {
    constructor() {
        this.elements = {
            speedometer: null,
            speedValue: null,
            turboIndicator: null,
            collectedItems: null,
            itemSlots: [],
            instructions: null,
            loading: null,
            debugInfo: null
        };
        
        this.turboTimeout = null;
    }

    init() {
        // UI要素の取得
        this.elements.speedometer = document.getElementById('speedometer');
        this.elements.speedValue = document.getElementById('speed-value');
        this.elements.turboIndicator = document.getElementById('turbo-indicator');
        this.elements.collectedItems = document.getElementById('collected-items');
        this.elements.instructions = document.getElementById('instructions');
        this.elements.loading = document.getElementById('loading');
        
        // アイテムスロットの取得
        for (let i = 1; i <= 3; i++) {
            this.elements.itemSlots.push(document.getElementById(`slot-${i}`));
        }
        
        // デバッグ情報パネルの作成
        this.createDebugPanel();
    }

    createDebugPanel() {
        // デバッグ情報表示用のパネルを作成
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-info';
        debugPanel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            display: none;
            min-width: 200px;
            z-index: 100;
        `;
        document.body.appendChild(debugPanel);
        this.elements.debugInfo = debugPanel;
    }

    updateSpeed(speed) {
        // 速度をkm/hに変換して表示
        const kmh = Math.round(speed * 3.6);
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = kmh;
        }
    }

    showTurbo(active) {
        if (this.elements.turboIndicator) {
            if (active) {
                this.elements.turboIndicator.style.display = 'block';
                
                // タイムアウトをクリア
                if (this.turboTimeout) {
                    clearTimeout(this.turboTimeout);
                    this.turboTimeout = null;
                }
            } else {
                // 少し遅延してから非表示
                this.turboTimeout = setTimeout(() => {
                    this.elements.turboIndicator.style.display = 'none';
                }, CONFIG.UI.turboIndicator.hideDelay);
            }
        }
    }

    updateCollectedItems(items) {
        // 収集アイテムの表示を更新
        this.elements.itemSlots.forEach((slot, index) => {
            if (index < items.length && items[index]) {
                slot.textContent = items[index];
                slot.classList.add('filled');
            } else {
                slot.textContent = '';
                slot.classList.remove('filled');
            }
        });
    }

    showInstructions(show = true) {
        if (this.elements.instructions) {
            this.elements.instructions.style.display = show ? 'block' : 'none';
        }
    }

    showLoading(show = true, message = '読み込み中...') {
        if (this.elements.loading) {
            this.elements.loading.style.display = show ? 'block' : 'none';
            if (show) {
                this.elements.loading.textContent = message;
            }
        }
    }

    updateDebugInfo(info) {
        if (this.elements.debugInfo) {
            let html = '<strong>デバッグ情報</strong><br>';
            
            if (info.position) {
                html += `位置: X:${info.position.x.toFixed(1)} Y:${info.position.y.toFixed(1)} Z:${info.position.z.toFixed(1)}<br>`;
            }
            
            if (info.speed !== undefined) {
                html += `速度: ${info.speed.toFixed(1)} m/s (${Math.round(info.speed * 3.6)} km/h)<br>`;
            }
            
            if (info.fps !== undefined) {
                html += `FPS: ${Math.round(info.fps)}<br>`;
            }
            
            if (info.physics) {
                html += `物理ボディ数: ${info.physics.bodies}<br>`;
            }
            
            if (info.custom) {
                Object.keys(info.custom).forEach(key => {
                    html += `${key}: ${info.custom[key]}<br>`;
                });
            }
            
            this.elements.debugInfo.innerHTML = html;
        }
    }

    showDebugInfo(show = true) {
        if (this.elements.debugInfo) {
            this.elements.debugInfo.style.display = show ? 'block' : 'none';
        }
    }

    // メッセージ表示（一時的な通知）
    showMessage(message, duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-family: sans-serif;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        // アニメーションスタイルを追加
        if (!document.getElementById('ui-animations')) {
            const style = document.createElement('style');
            style.id = 'ui-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 指定時間後に削除
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, duration);
    }

    dispose() {
        // デバッグパネルの削除
        if (this.elements.debugInfo && this.elements.debugInfo.parentNode) {
            this.elements.debugInfo.parentNode.removeChild(this.elements.debugInfo);
        }
        
        // タイムアウトのクリア
        if (this.turboTimeout) {
            clearTimeout(this.turboTimeout);
        }
    }
}