import { audioManager } from './audio';

let currentUtterance = null;

export const tts = {
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('不支持语音合成'));
        return;
      }

      this.stop(); // 停止之前的发声

      // 播放语音时降低 BGM 音量
      audioManager.setBgmVolume(0.1);

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 默认配置优化
      Object.assign(utterance, {
        rate: 0.9, // 语速稍慢适合儿童
        pitch: 1,
        volume: 1,
        lang: 'zh-CN',
        ...options
      });

      currentUtterance = utterance;

      utterance.onend = () => {
        currentUtterance = null;
        // 恢复 BGM 音量
        audioManager.setBgmVolume(0.3);
        resolve();
      };

      utterance.onerror = (event) => {
        // 如果是被 cancel 掉的，通常不视为错误
        currentUtterance = null;
        audioManager.setBgmVolume(0.3);
        // error.interrupted 是 iOS Safari 的一种情况
        if (event.error === 'interrupted' || event.error === 'canceled') {
           resolve(); 
        } else {
           reject(event);
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  },

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (currentUtterance) {
        audioManager.setBgmVolume(0.3);
        currentUtterance = null;
      }
    }
  }
};