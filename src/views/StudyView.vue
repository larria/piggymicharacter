<script setup>
import { nextTick, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import confetti from 'canvas-confetti'

import CCard from '../components/CCard.vue'
import PageHeader from '../components/PageHeader.vue'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// 当天还剩下多少个字可以学习
const charactersCountLeft = gameStore.DAILY_LEARN_LIMIT - gameStore.getTodayLearnCount()
// const charactersCountLeft = 2
// console.log(gameStore.DAILY_LEARN_LIMIT, gameStore.getTodayLearnCount(), charactersCountLeft);

// 随机从未学的字中选取 charactersCountLeft 个并乱序，组成这次的学习列表
const charactersToLearn = gameStore.unlearnedCharacters.slice().sort(() => 0.5 - Math.random()).slice(0, charactersCountLeft)
const currentCharacterIndex = ref(0);

const isCurrentCharacterFinished = ref(false)
const isAllFinished = ref(false)
const isTransitioning = ref(false)

const handleFinished = () => {
  // 在这里处理卡片播放完成后的逻辑
  console.log('该卡片播放完成')
  isCurrentCharacterFinished.value = true;
}

// 该组charactersCountLeft个汉字全部完成
const toExma = () => {
  showToast('敬请期待')
  // router.push('/exam')
}
const toHome = () => {
  router.push('/')
}

const showNextCharacter = async () => {
  gameStore.learnCharacter(charactersToLearn[currentCharacterIndex.value])
  // 在这里处理显示下一个汉字的逻辑
  console.log('显示下一个汉字')
  isTransitioning.value = true

  // 等待过渡动画开始后再改变状态
  await nextTick()

  setTimeout(() => {
    if (currentCharacterIndex.value < charactersToLearn.length - 1) {
      isCurrentCharacterFinished.value = false
      currentCharacterIndex.value++
    } else {
      isAllFinished.value = true
      // 所有汉字学习完毕，显示完成提示
      console.log('所有汉字学习完毕，显示完成提示')
      // 庆祝动画
      var end = Date.now() + (3 * 1000);

      // go Buckeyes!
      var colors = [
        '#FFD700',
        '#FF69B4',
        '#00CED1',
        '#FF6347'
      ];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
    isTransitioning.value = false
  }, 50)
}

// 根据汉字获取汉字信息
function getCharacterInfoFromCharacter(character) {
  const characterInfo = gameStore.allCharactersData.find((info) => info.character === character)
  return characterInfo
}
</script>

<template>
  <div class="study-container">
    <PageHeader>
      <template #center>
        <div class="study-head-center">
          <h2>汉字初识</h2>
          <p class="character-progress">{{ currentCharacterIndex + 1 }} / {{ charactersToLearn.length }}</p>
        </div>
      </template>
    </PageHeader>

    <!-- 使用 Transition 组件包裹 CCard -->
    <Transition name="card-flip" mode="out-in" @before-enter="isTransitioning = true" @after-enter="isTransitioning = false">
      <CCard :key="currentCharacterIndex" :cInfo="getCharacterInfoFromCharacter(charactersToLearn[currentCharacterIndex])" @finished="handleFinished" :class="{ 'card-completed': isCurrentCharacterFinished }" />
    </Transition>

    <footer>
      <Transition name="btn-bounce">
        <button class="btn btn-orange next-character" v-if="isCurrentCharacterFinished && !isTransitioning && !isAllFinished" @click="showNextCharacter">
          <span class="btn-emoji">✌️</span>
          我学会了！
        </button>
      </Transition>

      <Transition name="btn-bounce">
        <button class="btn btn-lemon next-character" v-if="isAllFinished && !isTransitioning" @click="toExma">
          <span class="btn-emoji">📚</span>
          去测验
        </button>
      </Transition>

      <Transition name="btn-bounce">
        <button class="btn btn-watermelon next-character" v-if="isAllFinished && !isTransitioning" @click="toHome">
          <span class="btn-emoji">🏠</span>
          回主界面
        </button>
      </Transition>
    </footer>
  </div>
</template>

<style scoped>
.study-container {
  position: relative;
  min-height: 500px;
  /* display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center; */
}

h2 {
  font-size: 30px;
}

.progress {
  font-size: 20px;
  font-weight: bold;
  color: #666;
}

/* 卡片翻转动画 */
.card-flip-enter-active {
  animation: flipInRight 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.card-flip-leave-active {
  animation: flipOutLeft 0.5s ease-in-out;
}

@keyframes flipInRight {
  0% {
    transform: translateX(100px) rotateY(90deg) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateX(-20px) rotateY(-10deg) scale(1.05);
  }
  100% {
    transform: translateX(0) rotateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes flipOutLeft {
  0% {
    transform: translateX(0) rotateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-100px) rotateY(-90deg) scale(0.8);
    opacity: 0;
  }
}

/* 按钮弹跳动画 */
.btn-bounce-enter-active {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.btn-bounce-leave-active {
  animation: bounceOut 0.3s ease-in;
}

@keyframes bounceIn {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

@keyframes bounceOut {
  0% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
}

/* 卡片完成状态的光晕效果 */
.card-completed {
  animation: glow 0.5s ease-in-out;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
  }
}

/* 按钮样式增强 */
.next-character {
  margin-top: 30px;
  position: relative;
  overflow: hidden;
}

.next-character::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.next-character:hover::before {
  width: 300px;
  height: 300px;
}

.btn-emoji {
  display: inline-block;
  animation: wave 1s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

footer {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 20px;
}
</style>