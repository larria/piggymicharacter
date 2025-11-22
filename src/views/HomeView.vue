<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { showToast } from '@/utils/gameToast'; 
import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';
// 引入图标
import { PhBookOpen, PhTrophy, PhImages, PhChartBar, PhLockKey } from '@phosphor-icons/vue';

const router = useRouter();
const gameStore = useGameStore();

// --- 状态与计算属性 ---

// 1. 汉字初识数据
const studyRemaining = computed(() => {
  return Math.max(0, gameStore.DAILY_LEARN_LIMIT - gameStore.getTodayLearnCount());
});

// 2. 复习游戏数据
// 是否未解锁
const isReviewLocked = computed(() => gameStore.learnedCharacters.length < gameStore.MIN_REVIEW_COUNT);
// 还需要多少个字
const reviewMissingCount = computed(() => Math.max(0, gameStore.MIN_REVIEW_COUNT - gameStore.learnedCharacters.length));
// 今日还能掌握多少个字（Boss血量相关）
const reviewRemaining = computed(() => {
  return Math.max(0, gameStore.DAILY_MASTER_LIMIT - gameStore.getTodayMasterCount());
});

// 3. 震动控制
const isShaking = ref(false);

// --- 交互逻辑 ---

// 触发震动
const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => isShaking.value = false, 500);
};

// 点击“汉字初识” Badge
const showStudyBadgeInfo = () => {
  audioManager.play('click');
  showToast(`加油！今天还能认识 ${studyRemaining.value} 个新汉字`);
};

// 点击“复习游戏” Badge
const showReviewBadgeInfo = () => {
  audioManager.play('click');
  if (isReviewLocked.value) {
    // 用法二：指定 Warning 类型 (橙色背景)
    showToast(
      `今天只认识了 ${gameStore.learnedCharacters.length} 个字\n还需要学会 ${reviewMissingCount.value} 个才能开启复习哦`,
      'warning',
      3500 // 稍微显示久一点
    );
  } else {
    // 用法三：指定 Success 类型 (绿色背景，或者用 info 蓝色也可以)
    showToast(
      `今日挑战剩余 ${reviewRemaining.value} 次\n去打败怪兽吧！`, 
      'success'
    );
  }
};

// 主导航逻辑
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
      // 锁定状态：播放拒绝音效 + 震动 + 显示原因
      audioManager.play('wrong');
      triggerShake();
      showReviewBadgeInfo(); // 复用 Badge 的提示文案
      return;
    }
  }
  
  // 正常跳转
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
      
      <!-- 1. 识字学校 (带 Badge) -->
      <div class="relative w-full max-w-sm group">
        <GameButton variant="primary" size="lg" :block="true" @click="navTo('/study')" class="shadow-xl">
          <PhBookOpen weight="fill" class="w-8 h-8" />
          <span>汉字初识</span>
        </GameButton>
        
        <!-- Badge: 学习剩余 -->
        <!-- 使用 transform translate 调整位置，padding 增大点击热区 -->
        <div 
          class="absolute -top-3 -right-3 z-10 cursor-pointer transition-transform active:scale-90 hover:scale-110"
          @click.stop="showStudyBadgeInfo"
        >
          <div class="bg-candy-red text-white font-bold border-2 border-white rounded-full min-w-[36px] h-9 flex items-center justify-center px-2 shadow-md animate-bounce-slow text-sm">
            {{ studyRemaining }}
          </div>
        </div>
      </div>

      <!-- 2. 复习竞技场 (带 Badge & 锁定状态) -->
      <div class="relative w-full max-w-sm">
        <!-- 按钮主体 -->
        <GameButton 
          variant="success" 
          size="lg" 
          :block="true" 
          @click="navTo('/exam')" 
          class="shadow-xl transition-all duration-200"
          :class="{ 
            'opacity-50 grayscale': isReviewLocked, 
            'animate-shake': isShaking 
          }"
        >
          <!-- 图标切换：锁住时显示 Lock，解锁显示 Trophy -->
          <PhLockKey v-if="isReviewLocked" weight="fill" class="w-8 h-8" />
          <PhTrophy v-else weight="fill" class="w-8 h-8" />
          
          <span>复习游戏</span>
        </GameButton>

        <!-- Badge: 复习状态 -->
        <div 
          class="absolute -top-3 -right-3 z-10 cursor-pointer transition-transform active:scale-90 hover:scale-110"
          @click.stop="showReviewBadgeInfo"
        >
           <!-- 分支 A: 锁定状态 (显示负数) -->
           <div v-if="isReviewLocked" class="bg-gray-500 text-white font-bold border-2 border-white rounded-full min-w-[40px] h-9 flex items-center justify-center px-2 shadow-md text-sm">
             -{{ reviewMissingCount }}
           </div>

           <!-- 分支 B: 正常状态 (显示剩余次数) -->
           <div v-else class="bg-candy-yellow text-candy-orange font-bold border-2 border-white rounded-full min-w-[36px] h-9 flex items-center justify-center px-2 shadow-md text-sm">
             {{ reviewRemaining }}
           </div>
        </div>
      </div>

      <!-- 3. 底部功能区 -->
      <div class="flex gap-6 w-full max-w-sm mt-2">
        <GameButton variant="warning" class="flex-1 shadow-lg" @click="navTo('/collection')">
          <PhImages weight="fill" class="w-6 h-6" />
          <span class="text-xl">画片</span>
        </GameButton>
        <GameButton variant="info" class="flex-1 shadow-lg" @click="navTo('/statistics')">
          <PhChartBar weight="fill" class="w-6 h-6" />
          <span class="text-xl">统计</span>
        </GameButton>
      </div>
      
    </div>
  </MainLayout>
</template>

<style scoped>
/* 慢速跳动，吸引注意 */
.animate-bounce-slow {
  animation: bounce 2s infinite;
}

/* 左右摇头动画 - 用于拒绝/锁定反馈 */
.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>