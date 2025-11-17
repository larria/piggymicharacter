// 播放语音
async function speakText(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('当前浏览器不支持语音合成功能'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, {
      rate: 1, pitch: 1, volume: 1, lang: 'zh-CN', ...options
    });
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`语音合成错误: ${event.error}`));
    window.speechSynthesis.speak(utterance);
  });
}

// 中止播放语音
function stopSpeak() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export default {
    speakText,
    stopSpeak
};