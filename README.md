### 项目简介

一个适用于幼儿园学前班的小朋友的汉字识字游戏

仅支持ipad横版

通过阅读和播放每个文字卡片，并进行测验题目练习，可赚取魔力

魔力值可以兑换画片，画片可以在画片馆里展示

### 已有资源

###### 全部文字数据

`./src/assets/data/data-full-all.json`，一共有1200多个汉字，其中有用的数据格式如下

```json
[
  {
        "character": "谢",
        "pinyin": "xiè",
        "example_words": [
            "谢谢",
            "感谢",
            "谢礼",
            "谢绝"
        ],
        "example_sentences": [
            "谢谢你给我喝水。",
            "孙悟空感谢唐僧的救命之恩。"
        ]
    },
    // ...
]
```

###### 全部可收集画片

图片素材位于`src/assets/images/cards/`目录下，每张图片命名规则为`c0.jpg`，`c1.jpg`等，共32张，其尺寸只有横竖两种1024 × 1536和1536× 1024两种

### 业务逻辑

针对每个字记录3种状态，分别为“未初识”，“已初识”，“已掌握”，初始状态为“未初识”

在`识字界面`，每完整听完一个字、它的全部词语、全部句子后，该字状态变为变为“已初识”，奖励魔力值`1`点；每天最多允许初识30个字

在`测验界面`，每答对一个字的相关测试题总共达到3次（因此需要记录该字的测验正确次数），该字状态变为“已掌握”，奖励魔力值`5`点；每天最多允许掌握30个字

在`画片界面`，可使用魔力值兑换画片，每张画片需要`160`点魔力值兑换

注意：每个字的状态变化要附带当前时间戳，最终状态需要逻辑判断，记录在本地LocalStorage，举例：

```js
// localStorage
[
  // 举例1：这个字已经初识，但测验还未通过达到3次，因此还是未掌握状态，最终状态为“已初识”
  {
    character: "谢",
    stateList: [
      {
        action: "初识",
        date: 1633584000000
      },
      {
        action: "测验",
        isCorrect: true,
        date: 1633684000000
      },
      {
        action: "测验",
        isCorrect: false,
        date: 1633684000000
      },
      {
        action: "测验",
        isCorrect: true,
        date: 1633684000000
      },
    ]
  }, 
  // 举例2：这个字已经初识，且测验通过达到3次，因此是已掌握状态，最终状态为“已掌握”
  {
    character: "和",
    stateList: [
      {
        action: "初识",
        date: 1635584000000
      },
      {
        action: "测验",
        isCorrect: true,
        date: 1637684000000
      },
      {
        action: "测验",
        isCorrect: false,
        date: 1638684000000
      },
      {
        action: "测验",
        isCorrect: true,
        date: 1639684000000
      },
      {
        action: "测验",
        isCorrect: true,
        date: 1639684000000
      },
    ]
  }, 
  // ...
]
```

### 界面说明

游戏主界面有如下主要按钮：
1. 初识：点击后进入`识字界面`
2. 测验（仅在已初识的字数大于20时高亮可点击）：点击后进入`测验界面`
3. 我认识的字：点击后进入`已掌握汉字统计界面`
4. 我收藏的画片：点击后进入`画片界面`

1. 识字界面
  - 右上角展示今日初始的字数限额和当前进度，如`5/30`，可用环形进度条展示
  - 随机选取一个`未初识`的字，展示其识字卡片
  - 识字卡片展示时，会依次播放主汉字、词语、句子
  - 阅读完成后，该卡片样式变为`完成`，该字状态变为“已初识”，并奖励魔力值`1`点；可以点击该卡片上的主汉字、词语、句子单独播放语音；同时，如果今日还有限额，就在卡片右侧显示“下一个字”按钮，点击后进入下一个字的识字卡片
  - 如果今日已达到限额，就不再展示“下一个字”按钮，并展示庆祝动画（如烟花、气球等）和“前往测验”
2. 测验界面
  - 右上角展示今日初始的字数限额和当前进度，如`5/30`，可用环形进度条展示
  - 测验类型为选择题：随机选取一个`已初识`的字作为目标字，从其全部词语从随机选取1个，并将词语中的目标字替换成`__`，再随机从所有其它字的词语中选取3个，每个同样将对应字替换成`__`，组成选择题的4个选项，打乱顺序并展示
  - 点击答案后，会展示正确或错误的动画（如对号、叉号等），并展示正确答案
  - 如果正确，该字测验正确次数+1；如果达到3次，该字状态变为“已识记”，并奖励魔力值`3`点，并在延迟2s后自动进入下一题
  - 如果错误，该字测验错误次数+1，同时展示该字的识字卡片，但不需要自动阅读，并在延迟5s后显示`下一题`按钮，点击后进入下一题
  - 今日测验全部结束后，会展示此次测验的正确率，如`正确率：80%`，展示庆祝动画（如烟花、气球等）和“前往兑换画片”按钮，点击后进入`画片界面`
3. 已掌握汉字统计界面
  - 在顶部显示统计数据，类似`初识：111/1283`和`掌握：161/1283`，用环形进度条展示，点击时用popover显示明细
  - 用mini卡片（只显示主汉字）展示所有汉字列表，以及每个汉字的3种状态
4. 画片界面
  - 在顶部显示魔力值
  - 展示全部画片列表，画片有`已兑换`和`未兑换`两种状态，按画片序号顺序展示，未兑换的画片用高斯模糊滤镜掩盖
  - 点击任意一张`已兑换`的画片，通过`vant`的`ImagePreview`组件最大化展示全部已兑换的画片，并注意用`startPosition`切换到点击的那张画片
  - 点击任意一张`未兑换`的画片，如果当前魔力值高于`160`，则提示是否兑换，点击`确定`后，魔力值减少`160`，该画片状态变为`已兑换`，并展示兑换动画（如烟花、气球等），并在延迟2s后自动展开展示


### 技术选型

可包括但不限于以下技术栈

- vite
- vue3
- pinia
- vue-router
- pinia-plugin-persistedstate
- vant

### 部分关键逻辑示例

以下仅供参考逻辑，不需要照搬

###### 识字卡片组件

```html
<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  cInfo: {
    type: Object,
    required: true,
  },
});

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
 * 语音合成函数 (同前)
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
  }
});

function getHighlightSentenceHTML(sentence, character) {
  return sentence.replace(new RegExp(character, 'g'), `<span class="character-highlight">${character}</span>`);
}
</script>

<template>
  <section class="ccard" :class="{ finished: isFinished }">
    <h2
      :class="{ speaking: speakingIndex === 0 }"
      @click="playItemOnClick(0)"
    >
      {{ cInfo.character }}
    </h2>
    <p class="pinyin">{{ cInfo.pinyin }}</p>
    <div class="words">
      <h3 class="sub-title">词语</h3>
      <!-- 改造：添加点击事件，注意索引计算 -->
      <span
        v-for="(word, index) in cInfo.example_words"
        :key="word"
        class="word-wrap"
        :class="{ speaking: speakingIndex === index + 1 }"
        @click="playItemOnClick(index + 1)"
      >
        {{ word }}
      </span>
    </div>
    <div class="sentences">
      <h3 class="sub-title">例句</h3>
      <!-- 改造：添加点击事件，注意索引计算 -->
      <p
        v-for="(sentence, index) in cInfo.example_sentences"
        :key="sentence"
        class="sentence-wrap"
        :class="{ speaking: speakingIndex === index + 1 + cInfo.example_words.length }"
        @click="playItemOnClick(index + 1 + cInfo.example_words.length)"
        v-html="getHighlightSentenceHTML(sentence, cInfo.character)"
      ></p>
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
  color: #e6a23c !important;
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
```

###### 画片组件

```html
<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
    cId: {
        type: Number,
        required: true,
    },
    // 解锁进度，0-1
    unlockProgress: {
        type: Number,
        default: 0,
    }
});
const blurCSS = computed(() => {
    // 如果解锁进度为1，完全清除模糊
    if (props.unlockProgress === 1) {
        return 'filter: blur(0px)';
    }

    // 计算基础模糊值：根据解锁进度从30递减
    // 当unlockProgress为0时，blur为30
    // 当unlockProgress增加时，blur从30开始递减
    const baseBlur = 20 * (1 - props.unlockProgress);

    // 确保如果解锁进度不为1，至少有5px的模糊
    const finalBlur = parseInt(props.unlockProgress, 10) === 1 ? 0 : Math.max(baseBlur, 5);

    return `filter: blur(${finalBlur}px)`;
});

const imgURL = computed(() => {
    return new URL(`../assets/images/cards/c${props.cId}.jpg`, import.meta.url).href;
});
</script>

<template>
    <div class="pcard">
        <img class="pcard-img" :src="imgURL" alt="" :style="blurCSS">
    </div>
</template>

<style scoped>
/* 卡片容器 */
.pcard {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    border-radius: 16px;
    /* 使用更圆润的边角，显得更现代 */
    overflow: hidden;
    /* 关键：确保图片圆角被裁剪 */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    /* 柔和的阴影，增加层次感 */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 平滑的过渡动画 */
    cursor: pointer;
    /* 提示用户可交互 */
}
.pcard-img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    /* 关键：保证图片不变形且填满容器 */
    transition: all 1s ease-in-out;
    /* 图片独立的、稍慢的缩放动画 */
}

/* 鼠标悬停效果 */
.pcard:hover {
    transform: translateY(-10px) scale(1.02);
    /* 轻微上浮并放大 */
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    /* 加深阴影，强化“浮起”效果 */
}

/* 鼠标悬停时，图片进一步放大 */
.pcard:hover .pcard-img {
    transform: scale(1.03);
    /* 图片放大，创造视差感 */
}
</style>
```