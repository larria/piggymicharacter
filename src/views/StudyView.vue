<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import confetti from 'canvas-confetti';
import { PhArrowLeft, PhCheck, PhArrowRight } from '@phosphor-icons/vue';

import MainLayout from '@/components/layout/MainLayout.vue';
import CharLearningCard from '@/components/business/CharLearningCard.vue';
import GameButton from '@/components/base/GameButton.vue';
import GameProgress from '@/components/base/GameProgress.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';

const router = useRouter();
const gameStore = useGameStore();

// 状态
const isLoading = ref(true);
const learningQueue = ref([]);
const currentIndex = ref(0);
const isTransitioning = ref(false);
const isCardFinished = ref(false); // 控制“我学会了”按钮的显示

const currentCharacterInfo = computed(() => {
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

  // 【修正点1】这里不再调用 learnCharacter，改为点击按钮时调用
  // 这样如果中途退出，就不算今日已学

  isLoading.value = false;
};

const handleCardFinish = () => {
  // 【修正点2】卡片自动朗读完毕后，显示按钮
  isCardFinished.value = true;
};

const nextChar = async () => {
  // 【修正点3】用户确认学会了，此时才写入状态
  const currentChar = learningQueue.value[currentIndex.value];
  gameStore.learnCharacter(currentChar);

  audioManager.play('click');

  if (currentIndex.value < totalCount.value - 1) {
    isTransitioning.value = true;
    isCardFinished.value = false; // 重置按钮状态

    setTimeout(() => {
      currentIndex.value++;
      isTransitioning.value = false;
    }, 300);
  } else {
    currentIndex.value++; // 溢出以显示完成页
    audioManager.play('celebrate');
    fireConfetti();
  }
};

const goHome = () => router.push('/');
const goExam = () => router.push('/exam');

const fireConfetti = () => {
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
    <div class="flex items-center gap-4 mb-4">
      <button @click="goHome" class="p-2 bg-white/50 rounded-full hover:bg-white transition">
        <PhArrowLeft size="24" />
      </button>

      <!-- 进度条 (flex-1 占满剩余空间) -->
      <div class="flex-1">
        <GameProgress :value="Math.min(progressValue, totalCount)" :max="totalCount" color="bg-candy-blue" />
      </div>

      <!-- 【新增】魔力瓶模块 -->
      <MagicCapsule />
    </div>

    <div class="flex-1 flex flex-col items-center justify-center relative perspective-wrapper" v-if="!isLoading">
      <Transition name="card-slide" mode="out-in">
        <div v-if="!isAllDone && currentCharacterInfo" :key="currentIndex" class="w-full flex justify-center">
          <CharLearningCard :info="currentCharacterInfo" :autoPlay="true" @finish="handleCardFinish" />
        </div>

        <div v-else-if="isAllDone" class="text-center animate__animated animate__zoomIn bg-white/90 p-8 rounded-3xl shadow-2xl max-w-md">
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

    <!-- 【修正点4】按钮显示增加 isCardFinished 判断 -->
    <!-- 使用 invisible 而不是 v-if 保持布局高度，避免按钮出现时页面跳动 -->
    <div v-if="!isAllDone && !isLoading" class="mt-8 flex justify-center pb-4 h-20 transition-opacity duration-500" :class="isCardFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'">
      <GameButton size="lg" variant="primary" class="w-48 shadow-xl" @click="nextChar">
        <PhCheck weight="bold" class="mr-2" />
        <span>我学会了</span>
        <PhArrowRight weight="bold" class="ml-2" />
      </GameButton>
    </div>
  </MainLayout>
</template>

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