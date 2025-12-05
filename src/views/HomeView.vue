<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { showToast } from '@/utils/gameToast';
import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';
import { PhBookOpen, PhTrophy, PhImages, PhChartBar, PhLockKey } from '@phosphor-icons/vue';

const router = useRouter();
const gameStore = useGameStore();

// --- 状态与计算属性 ---

// 1. 汉字初识数据
const studyRemaining = computed(() => {
  return Math.max(0, gameStore.DAILY_LEARN_LIMIT - gameStore.getTodayLearnCount());
});

// 2. 复习游戏数据
const isReviewLocked = computed(() => gameStore.learnedCharacters.length < gameStore.MIN_REVIEW_COUNT);
const reviewMissingCount = computed(() => Math.max(0, gameStore.MIN_REVIEW_COUNT - gameStore.learnedCharacters.length));
const reviewRemaining = computed(() => {
  const todayDone = gameStore.getTodayMasterCount();
  const remainingCandidates = gameStore.learnedCharacters.length;
  const potentialTotal = todayDone + remainingCandidates;
  const dailyLimit = Math.min(gameStore.DAILY_MASTER_LIMIT, potentialTotal);
  return Math.min(Math.max(0, gameStore.DAILY_MASTER_LIMIT - gameStore.getTodayMasterCount()), dailyLimit);
});

// 【新增】3. 统计数据文本 (已初识 / 已掌握 / 全部)
const statsText = computed(() => {
  const learned = gameStore.learnedCharacters.length;
  const mastered = gameStore.masteredCharacters.length;
  const total = gameStore.allCharactersData.length;
  return `${learned} / ${mastered} / ${total}`;
});

// 4. 震动控制
const isShaking = ref(false);

// --- 交互逻辑 ---

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => isShaking.value = false, 500);
};

const showStudyBadgeInfo = () => {
  audioManager.play('click');
  showToast(`加油！今天还能认识 ${studyRemaining.value} 个新汉字`);
};

const showReviewBadgeInfo = () => {
  audioManager.play('click');
  if (isReviewLocked.value) {
    showToast(
      `当前只认识了 ${gameStore.learnedCharacters.length} 个字\n还需要认识 ${reviewMissingCount.value} 个才能开启复习哦`,
      'warning',
      3500
    );
  } else {
    showToast(
      `今日剩余 ${reviewRemaining.value} 个字可以复习\n去打败怪兽吧！`,
      'success'
    );
  }
};

// 【新增】点击统计气泡的反馈
const showStatsInfo = () => {
  audioManager.play('click');
  showToast('进度：已初识 / 已掌握 / 总字数');
};

const navTo = (route) => {
  if (route === '/study') {
    if (studyRemaining.value === 0) {
      audioManager.play('correct');
      showToast('今天的任务完成啦，明天再来吧！', 'success');
      return;
    }
  }

  if (route === '/exam') {
    if (isReviewLocked.value) {
      audioManager.play('wrong');
      triggerShake();
      showReviewBadgeInfo();
      return;
    }
  }

  router.push(route);
};
</script>

<template>
  <MainLayout bgImage="bg_world_map.jpg">
    <!-- 顶部栏 -->
    <template #header>
      <div class="flex items-center gap-4 w-full justify-between">
        <div class="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full p-2 pr-4 border-2 border-white shadow-sm">
          <div class="w-10 h-10 bg-candy-blue rounded-full flex items-center justify-center text-2xl">🐷</div>
          <span class="font-bold text-dark-text">咪猪头</span>
        </div>
        <MagicCapsule />
      </div>
    </template>

    <!-- 中央地图区域 -->
    <div class="flex-1 flex flex-col items-center justify-center gap-10 pb-10 relative">

      <!-- 1. 识字学校 -->
      <div class="relative w-full max-w-sm group">
        <GameButton variant="primary" size="lg" :block="true" @click="navTo('/study')" class="shadow-xl">
          <PhBookOpen weight="fill" class="w-8 h-8" />
          <span>汉字初识</span>
        </GameButton>
        <div class="absolute -top-3 -right-3 z-10 cursor-pointer transition-transform active:scale-90 hover:scale-110" @click.stop="showStudyBadgeInfo">
          <div class="bg-candy-red text-white font-bold border-2 border-white rounded-full min-w-[36px] h-9 flex items-center justify-center px-2 shadow-md animate-bounce-slow text-sm">
            {{ studyRemaining }}
          </div>
        </div>
      </div>

      <!-- 2. 复习竞技场 -->
      <div class="relative w-full max-w-sm">
        <GameButton variant="success" size="lg" :block="true" @click="navTo('/exam')" class="shadow-xl transition-all duration-200" :class="{
          'opacity-50 grayscale': isReviewLocked,
          'animate-shake': isShaking
        }">
          <PhLockKey v-if="isReviewLocked" weight="fill" class="w-8 h-8" />
          <PhTrophy v-else weight="fill" class="w-8 h-8" />
          <span>复习游戏</span>
        </GameButton>
        <div class="absolute -top-3 -right-3 z-10 cursor-pointer transition-transform active:scale-90 hover:scale-110" @click.stop="showReviewBadgeInfo">
          <div v-if="isReviewLocked" class="bg-gray-500 text-white font-bold border-2 border-white rounded-full min-w-[40px] h-9 flex items-center justify-center px-2 shadow-md text-sm">
            -{{ reviewMissingCount }}
          </div>
          <div v-else class="bg-candy-yellow text-candy-orange font-bold border-2 border-white rounded-full min-w-[36px] h-9 flex items-center justify-center px-2 shadow-md text-sm">
            {{ reviewRemaining }}
          </div>
        </div>
      </div>

      <!-- 3. 底部功能区 -->
      <div class="flex gap-6 w-full max-w-sm mt-2">
        <!-- 画片按钮 -->
        <GameButton variant="warning" class="flex-1 shadow-lg" @click="navTo('/collection')">
          <PhImages weight="fill" class="w-6 h-6" />
          <span class="text-xl">画片</span>
        </GameButton>

        <!-- 统计按钮 (包裹在 relative 容器中以定位气泡) -->
        <div class="flex-1 relative group">
          <GameButton variant="info" class="w-full shadow-lg" @click="navTo('/statistics')">
            <PhChartBar weight="fill" class="w-6 h-6" />
            <span class="text-xl">统计</span>
          </GameButton>

          <!-- 
             【新增】统计数据胶囊气泡
             使用 absolute 定位到按钮右上角
             min-w 保证胶囊形状
             whitespace-nowrap 防止文字换行
           -->
          <div class="absolute -top-4 -right-2 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" @click.stop="showStatsInfo">
            <div class="bg-white text-candy-purple border-2 border-candy-purple rounded-full px-3 h-8 flex items-center justify-center shadow-md text-xs font-bold whitespace-nowrap">
              {{ statsText }}
            </div>
          </div>
        </div>

      </div>

    </div>
  </MainLayout>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 2s infinite;
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
}

@keyframes shake {
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }
  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>