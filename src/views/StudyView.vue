<!-- ===== views/StudyView.vue ===== -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
// 【修改】引入 isAudioUnlocked
import { audioManager, isAudioUnlocked } from '@/utils/audio';
import confetti from 'canvas-confetti';
// 【修改】补充引入 Play 图标
import { PhArrowLeft, PhCheck, PhArrowRight, PhPlayCircle } from '@phosphor-icons/vue';

import MainLayout from '@/components/layout/MainLayout.vue';
import CharLearningCard from '@/components/business/CharLearningCard.vue';
import GameButton from '@/components/base/GameButton.vue';
import GameProgress from '@/components/base/GameProgress.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';

const router = useRouter();
const gameStore = useGameStore();

// 状态
const isLoading = ref(true);
// 【新增】等待用户交互的状态
const waitingForInteraction = ref(false);

const learningQueue = ref([]);
const currentIndex = ref(0);
const isTransitioning = ref(false);
const isCardFinished = ref(false);

const currentCharacterInfo = computed(() => {
  // ... (保持不变)
  if (!learningQueue.value.length) return null;
  const char = learningQueue.value[currentIndex.value];
  return gameStore.allCharactersData.find(i => i.character === char);
});

const progressValue = computed(() => currentIndex.value + 1);
const totalCount = computed(() => learningQueue.value.length);
const isAllDone = computed(() => currentIndex.value >= learningQueue.value.length);

onMounted(() => {
  prepareStudyData();
});

const prepareStudyData = () => {
  const countLeft = gameStore.DAILY_LEARN_LIMIT - gameStore.getTodayLearnCount();

  if (countLeft <= 0) {
    router.replace('/');
    return;
  }

  const chars = gameStore.unlearnedCharacters
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, countLeft);

  learningQueue.value = chars;
  currentIndex.value = 0;

  // 【核心修改】逻辑分支：
  // 1. 如果音频未解锁(刷新进入)，设为 waitingForInteraction，显示开始按钮
  // 2. 如果已解锁(从首页进入)，直接开始
  if (!isAudioUnlocked.value) {
    waitingForInteraction.value = true;
  }

  isLoading.value = false;
};

// 【新增】手动开始函数
const handleStart = () => {
  audioManager.initAudioContext(); // 这行代码由点击触发，完美解锁 iOS 音频
  waitingForInteraction.value = false;
};

const handleCardFinish = () => {
  // ... (保持不变)
  isCardFinished.value = true;
};

const nextChar = async () => {
  // ... (保持不变)
  const currentChar = learningQueue.value[currentIndex.value];
  gameStore.learnCharacter(currentChar);

  audioManager.play('click');

  if (currentIndex.value < totalCount.value - 1) {
    isTransitioning.value = true;
    isCardFinished.value = false;

    setTimeout(() => {
      currentIndex.value++;
      isTransitioning.value = false;
    }, 300);
  } else {
    currentIndex.value++;
    audioManager.play('celebrate');
    fireConfetti();
  }
};

const goHome = () => router.push('/');
const goExam = () => router.push('/exam');
const fireConfetti = () => {
  // ... (保持不变)
  const duration = 3000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());
};
</script>

<template>
  <MainLayout bgImage="bg_common.jpg">
    <!-- 顶部导航与进度 -->
    <div class="flex items-center gap-4 mb-2 flex-shrink-0"> <!-- 【修改】mb-4 -> mb-2, 防止占用过多高度 -->
      <button @click="goHome" class="p-2 bg-white/50 rounded-full hover:bg-white transition">
        <PhArrowLeft size="24" />
      </button>

      <div class="flex-1">
        <GameProgress :value="Math.min(progressValue, totalCount)" :max="totalCount" color="bg-candy-blue" />
      </div>

      <MagicCapsule />
    </div>
    <div class="flex-1 flex flex-col items-center justify-center relative perspective-wrapper min-h-0 w-full overflow-visible py-4" v-if="!isLoading">
      
      <!-- 等待交互遮罩 -->
      <div v-if="waitingForInteraction" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-3xl">
        <button @click="handleStart" class="flex flex-col items-center gap-4 animate-bounce-sm group">
            <PhPlayCircle size="96" weight="fill" class="text-candy-blue drop-shadow-xl group-hover:scale-110 transition-transform duration-300" />
            <span class="text-3xl font-bold text-candy-blue font-cartoon tracking-wider bg-white px-6 py-2 rounded-full shadow-md">
                点击开始学习
            </span>
        </button>
      </div>

      <Transition name="card-slide" mode="out-in" v-else>
        <!-- 
            【修改】卡片容器
            1. 确保 w-full 
            2. 去掉过多的 padding 防止挤压
        -->
        <div v-if="!isAllDone && currentCharacterInfo" :key="currentIndex" class="w-full h-full flex items-center justify-center p-2">
          <CharLearningCard :info="currentCharacterInfo" :autoPlay="true" @finish="handleCardFinish" />
        </div>

        <div v-else-if="isAllDone" class="text-center animate__animated animate__zoomIn bg-white/90 p-8 rounded-3xl shadow-2xl max-w-md m-auto">
          <!-- ... 完成页保持不变 ... -->
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-3xl font-bold text-candy-green mb-2">太棒了！</h2>
          <p class="text-gray-600 mb-8 text-lg">你已经完成了今天的初识任务！</p>
          <div class="flex flex-col gap-4">
            <GameButton variant="success" size="lg" :block="true" @click="goExam">
              去测验巩固
            </GameButton>
            <GameButton variant="secondary" :block="true" @click="goHome">
              返回主页
            </GameButton>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 
        【修改】底部按钮区域
        1. mt-8 -> my-2 (大幅减少垂直间距)
        2. h-20 -> h-auto py-2 (高度改为自适应，防止定高占位)
        3. flex-shrink-0 确保按钮不会被挤扁
    -->
    <div v-if="!isAllDone && !isLoading && !waitingForInteraction" class="my-2 py-2 flex-shrink-0 flex justify-center transition-opacity duration-500 min-h-[80px] items-center" :class="isCardFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'">
      <GameButton size="lg" variant="primary" class="w-48 shadow-xl" @click="nextChar">
        <PhCheck weight="bold" class="mr-2" />
        <span>我学会了</span>
        <PhArrowRight weight="bold" class="ml-2" />
      </GameButton>
    </div>
  </MainLayout>
</template>

<!-- ... (样式保持不变) ... -->
<style scoped>
.perspective-wrapper {
  perspective: 1200px;
}
.card-slide-enter-active, .card-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-slide-enter-from {
  opacity: 0;
  transform: translateX(100%) rotateY(-20deg) scale(0.8);
}
.card-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%) rotateY(20deg) scale(0.8);
}
</style>