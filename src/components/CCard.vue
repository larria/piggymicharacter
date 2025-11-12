<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  cInfo: {
    type: Object,
    required: true,
  },
});

// 声明自定义事件
const emit = defineEmits(['finished']);

// 追踪当前朗读的条目索引
const speakingIndex = ref(-1);
// 标记是否全部朗读完毕
const isFinished = ref(false);
// 进度条
const speakProgress = ref(0);
// 状态锁，防止语音重叠
const isBusySpeaking = ref(false);

const speakContent = [
  { text: props.cInfo.character, config: { rate: 0.03, lang: 'zh-CN' } }
].concat(props.cInfo.example_words.map(word => ({
  text: word,
  config: { rate: 0.7, lang: 'zh-CN' }
}))).concat(props.cInfo.example_sentences.map(sentence => ({
  text: sentence,
  config: { rate: 1, lang: 'zh-CN' }
})));

/**
 * 语音合成函数
 */
async function speakText(text, options = {}) {
  // ... (代码与之前版本相同，此处省略以保持简洁)
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('当前浏览器不支持语音合成功能'));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, {
      rate: 1, pitch: 1, volume: 1, lang: 'zh-CN', ...options
    });
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`语音合成错误: ${event.error}`));
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 处理用户点击播放的函数
 * @param {number} index - 在 speakContent 数组中的索引
 */
async function playItemOnClick(index) {
  // 如果当前正在播放，则不响应新的点击
  // 并且只在全部播放完成后才允许点击
  if (isBusySpeaking.value || !isFinished.value) {
    return;
  }

  isBusySpeaking.value = true;
  speakingIndex.value = index;

  try {
    const { text, config } = speakContent[index];
    await speakText(text, config);
  } catch (error) {
    console.error(error);
  } finally {
    // 朗读结束后，重置高亮索引并释放状态锁
    speakingIndex.value = -1;
    isBusySpeaking.value = false;
  }
}

// 组件挂载后，开始自动播放
onMounted(async () => {
  if (props.cInfo) {
    isBusySpeaking.value = true; // 锁定状态

    for (let i = 0; i < speakContent.length; i++) {
      speakingIndex.value = i;
      const { text, config } = speakContent[i];
      await new Promise((resolve) => setTimeout(resolve, 500));
      await speakText(text, config);
      speakProgress.value = Math.round(((i + 1) / speakContent.length) * 100);
    }

    speakingIndex.value = -1;
    isFinished.value = true;
    isBusySpeaking.value = false; // 释放状态锁
    
    // 触发 finished 事件
    emit('finished');
  }
});

function getHighlightSentenceHTML(sentence, character) {
  return sentence.replace(new RegExp(character, 'g'), `<span class="character-highlight">${character}</span>`);
}
</script>

<template>
  <section class="ccard" :class="{ finished: isFinished }">
    <h2 :class="{ speaking: speakingIndex === 0 }" @click="playItemOnClick(0)">
      {{ cInfo.character }}
    </h2>
    <p class="pinyin">{{ cInfo.pinyin }}</p>
    <div class="words">
      <h3 class="sub-title">词语</h3>
      <!-- 改造：添加点击事件，注意索引计算 -->
      <span v-for="(word, index) in cInfo.example_words" :key="word" class="word-wrap" :class="{ speaking: speakingIndex === index + 1 }" @click="playItemOnClick(index + 1)">
        {{ word }}
      </span>
    </div>
    <div class="sentences">
      <h3 class="sub-title">例句</h3>
      <!-- 改造：添加点击事件，注意索引计算 -->
      <p v-for="(sentence, index) in cInfo.example_sentences" :key="sentence" class="sentence-wrap" :class="{ speaking: speakingIndex === index + 1 + cInfo.example_words.length }" @click="playItemOnClick(index + 1 + cInfo.example_words.length)" v-html="getHighlightSentenceHTML(sentence, cInfo.character)"></p>
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
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.ccard.finished {
  border-color: #67c23a;
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.2);
}

/* 完成后，为可点击元素添加鼠标指针样式 */
.ccard.finished h2,
.ccard.finished .word-wrap,
.ccard.finished .sentence-wrap {
  cursor: pointer;
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
  transition: all 0.3s ease;
  /* text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); */
}

h2.speaking {
  color: #409eff;
  transform: scale(1.1);
}

.pinyin {
  font-size: 18px;
  text-align: center;
  margin: 0 0 20px;
  color: #666;
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
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.sentence-wrap:hover {
  background-color: #f0f0f0;
}

.sentence-wrap.speaking {
  background-color: #e9f5fe;
  border-left-color: #409eff;
}

:deep(.character-highlight) {
  background-color: #ffd700;
  color: #333;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.van-progress {
  margin-top: 16px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 10px 10px rgba(64, 158, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>