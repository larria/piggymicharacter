<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  cInfo: {
    type: Object,
    required: true,
  },
});

const speakProgress = ref(0);

/**
 * 使用浏览器语音合成API朗读文本
 * @param {string} text - 要朗读的文本内容
 * @param {Object} [options] - 配置选项
 * @param {number} [options.rate=1] - 语速 (0.1-10)
 * @param {number} [options.pitch=1] - 音调 (0-2)
 * @param {number} [options.volume=1] - 音量 (0-1)
 * @param {string} [options.lang='zh-CN'] - 语言代码
 * @returns {Promise} 返回一个Promise，朗读完成后resolve
 */
function speakText(text, options = {}) {
  return new Promise((resolve, reject) => {
    // 检查浏览器支持性
    if (!('speechSynthesis' in window)) {
      reject(new Error('当前浏览器不支持语音合成功能'));
      return;
    }

    // 合并配置参数
    const config = {
      rate: options.rate || 1,
      pitch: options.pitch || 1,
      volume: options.volume || 1,
      lang: options.lang || 'zh-CN'
    };

    // 创建语音合成对象
    const utterance = new SpeechSynthesisUtterance(text);

    // 设置语音参数
    utterance.rate = Math.min(Math.max(config.rate, 0.1), 10);
    utterance.pitch = Math.min(Math.max(config.pitch, 0), 2);
    utterance.volume = Math.min(Math.max(config.volume, 0), 1);
    utterance.lang = config.lang;

    // 设置回调函数
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`语音合成错误: ${event.error}`));

    // 开始朗读
    window.speechSynthesis.speak(utterance);
  });
}

onMounted(() => {
  if (props.cInfo) {
    speakText(props.cInfo.character, {
      rate: 0.03,
    }).then(() => {
      console.log('语音合成完成');
    }).catch((error) => {
      console.error('语音合成错误:', error);
    });
  }
});

function getHighlightSentenceHTML(sentence, character) {
  return sentence.replace(new RegExp(character, 'g'), `<span class="character-highlight">${character}</span>`);
}
</script>

<template>
  <section class="ccard">
    <h2>{{ cInfo.character }}</h2>
    <p class="pinyin">{{ cInfo.pinyin }}</p>
    <div class="words">
      <h3 class="sub-title">词语</h3>
      <span v-for="word in cInfo.example_words" :key="word" class="word-wrap">{{ word }}</span>
    </div>
    <div class="sentences">
      <h3 class="sub-title">例句</h3>
      <p v-for="sentence in cInfo.example_sentences" :key="sentence" class="sentence-wrap" v-html="getHighlightSentenceHTML(sentence, cInfo.character)"></p>
    </div>
    <van-progress :percentage="speakProgress" />
  </section>
</template>

<style scoped>
.ccard {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 16px;
  max-width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: all 0.3s ease;
}

.ccard:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

h2 {
  font-size: 48px;
  text-align: center;
  margin: 0 0 8px;
  color: #333;
  font-weight: bold;
}

.pinyin {
  font-size: 18px;
  text-align: center;
  margin: 0 0 20px;
  color: #666;
  font-style: italic;
}

.words, .sentences {
  margin-bottom: 24px;
}

.sub-title {
  font-size: 18px;
  margin: 0 0 12px;
  color: #409eff;
  border-left: 4px solid #409eff;
  padding-left: 8px;
}

.word-wrap {
  display: inline-block;
  background-color: #f0f7ff;
  color: #409eff;
  padding: 6px 12px;
  margin: 4px;
  border-radius: 16px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.word-wrap:hover {
  background-color: #e1f0ff;
  transform: scale(1.05);
}

.word-wrap.speaking {
  background-color: #409eff;
  color: white;
  animation: pulse 1.5s infinite;
}

.sentence-wrap {
  margin: 8px 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 16px;
  position: relative;
  transition: all 0.2s ease;
}

.sentence-wrap:hover {
  background-color: #f0f0f0;
}

.sentence-wrap.speaking {
  background-color: #f0f7ff;
  border-left: 4px solid #409eff;
  animation: pulse 1.5s infinite;
}

:deep(.character-highlight)  {
  color: #e6a23c!important;
  font-weight: bold;
}

.van-progress {
  margin-top: 16px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
</style>
