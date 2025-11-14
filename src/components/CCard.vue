<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  cInfo: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['finished']);

const speakingIndex = ref(-1);
const isFinished = ref(false);
const speakProgress = ref(0);
const isBusySpeaking = ref(false);

const characterRepetitions = Array(3).fill({
  text: props.cInfo.character,
  config: { rate: 0.03, lang: 'zh-CN' }
});

const speakContent = [
  ...characterRepetitions
].concat(props.cInfo.example_words.map(word => ({
  text: word,
  config: { rate: 0.7, lang: 'zh-CN' }
}))).concat(props.cInfo.example_sentences.map(sentence => ({
  text: sentence,
  config: { rate: 1, lang: 'zh-CN' }
})));

async function speakText(text, options = {}) {
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

async function playItemOnClick(index) {
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
    speakingIndex.value = -1;
    isBusySpeaking.value = false;
  }
}

// 组件挂载后，开始自动播放
onMounted(async () => {
  if (props.cInfo) {
    isBusySpeaking.value = true;

    for (let i = 0; i < speakContent.length; i++) {
      if (!isBusySpeaking.value) return;

      const { text, config } = speakContent[i];

      // **** 核心改动点 ****
      // 1. 先设置朗读条目之间的停顿 (第一次除外)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      if (!isBusySpeaking.value) return; // 再次检查，防止在等待时组件被卸载

      // 2. 在即将播放时，才设置高亮
      //    只有前三次是读汉字，使用相同的 speakingIndex (值为0) 来高亮
      //    之后的词语和句子，索引要进行相应调整
      if (i < 3) {
        speakingIndex.value = 0; // 汉字高亮
      } else if (i < 3 + props.cInfo.example_words.length) {
        speakingIndex.value = i; // 词语高亮 (因为 speakContent 数组结构变了，这里直接用 i 即可)
      } else {
        speakingIndex.value = i; // 句子高亮
      }

      // 3. 立即开始朗读
      await speakText(text, config);
      // **** 改动结束 ****

      speakProgress.value = Math.round(((i + 1) / speakContent.length) * 100);
    }

    speakingIndex.value = -1;
    isFinished.value = true;
    isBusySpeaking.value = false;
    emit('finished');
  }
});


onUnmounted(() => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isBusySpeaking.value = false;
});

function getHighlightSentenceHTML(sentence, character) {
  return sentence.replace(new RegExp(character, 'g'), `<span class="character-highlight">${character}</span>`);
}
</script>

<template>
  <section class="ccard" :class="{ finished: isFinished }">
    <!-- 点击播放汉字的索引是 0, 1, 2。我们点击时播放第一个即可 -->
    <h2 :class="{ speaking: speakingIndex === 0 }" @click="playItemOnClick(0)">
      {{ cInfo.character }}
    </h2>
    <p class="pinyin">{{ cInfo.pinyin }}</p>
    <div class="words">
      <h3 class="sub-title">词语</h3>
      <!-- speakContent 中词语的起始索引是 3 -->
      <span v-for="(word, index) in cInfo.example_words" :key="word" class="word-wrap" :class="{ speaking: speakingIndex === index + 3 }" @click="playItemOnClick(index + 3)">
        {{ word }}
      </span>
    </div>
    <div class="sentences">
      <h3 class="sub-title">例句</h3>
      <!-- speakContent 中句子的起始索引是 3 + 词语数量 -->
      <p v-for="(sentence, index) in cInfo.example_sentences" :key="sentence" class="sentence-wrap" :class="{ speaking: speakingIndex === index + 3 + cInfo.example_words.length }" @click="playItemOnClick(index + 3 + cInfo.example_words.length)" v-html="getHighlightSentenceHTML(sentence, cInfo.character)"></p>
    </div>
    <van-progress :percentage="speakProgress" />
  </section>
</template>

<style scoped>
.ccard {
  /* max-width: 600px; */
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
  animation: pulse2 1.5s infinite;
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

@keyframes pulse2 {
  0% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(64, 158, 255, 0.7);
  }
  70% {
    transform: scale(1.1);
    text-shadow: 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>