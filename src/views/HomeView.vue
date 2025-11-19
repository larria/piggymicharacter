<script setup>
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { showToast } from 'vant'; // 暂时保留 vant 的 toast，以后可以自己封装
import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';
import GameProgress from '@/components/base/GameProgress.vue';
// 修改引入：全部增加 Ph 前缀
import { PhBookOpen, PhTrophy, PhImages, PhChartBar } from '@phosphor-icons/vue';

const router = useRouter();
const gameStore = useGameStore();

// 导航逻辑
const navTo = (route) => {
  if (route === '/study') {
    if (gameStore.getTodayLearnCount() >= gameStore.DAILY_LEARN_LIMIT) {
      audioManager.play('correct'); // 用欢快的音效代替
      showToast('今天的任务完成啦，明天再来吧！');
      return;
    }
  }
  if (route === '/exam') {
    if (gameStore.learnedCharacters.length === 0) {
      audioManager.play('wrong');
      showToast('还没有学习过汉字，先去“汉字初识”吧~');
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
        <!-- 左侧：简单的用户信息（未来可以做头像） -->
        <div class="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full p-2 pr-4 border-2 border-white shadow-sm">
          <div class="w-10 h-10 bg-candy-blue rounded-full flex items-center justify-center text-2xl">🐷</div>
          <span class="font-bold text-dark-text">咪猪头</span>
        </div>
        
        <!-- 右侧：魔力值 -->
        <MagicCapsule />
      </div>
    </template>

    <!-- 中央地图区域 -->
    <div class="flex-1 flex flex-col items-center justify-center gap-8 pb-10 relative">
      
      <!-- 1. 识字学校 -->
      <div class="relative w-full max-w-sm">
        <GameButton variant="primary" size="lg" :block="true" @click="navTo('/study')" class="shadow-xl">
          <!-- 修改标签 -->
          <PhBookOpen weight="fill" class="w-8 h-8" />
          <span>汉字初识</span>
        </GameButton>
        <!-- ... (进度条代码不变) ... -->
      </div>

      <!-- 2. 复习竞技场 -->
      <div class="relative w-full max-w-sm">
        <GameButton variant="success" size="lg" :block="true" @click="navTo('/exam')" class="shadow-xl" :disabled="gameStore.learnedCharacters.length === 0">
          <!-- 修改标签 -->
          <PhTrophy weight="fill" class="w-8 h-8" />
          <span>复习游戏</span>
        </GameButton>
         <!-- ... (进度条代码不变) ... -->
      </div>

      <!-- 3. 底部功能区 -->
      <div class="flex gap-6 w-full max-w-sm mt-4">
        <GameButton variant="warning" class="flex-1 shadow-lg" @click="navTo('/collection')">
          <!-- 修改标签 -->
          <PhImages weight="fill" class="w-6 h-6" />
          <span class="text-xl">画片</span>
        </GameButton>
        <GameButton variant="info" class="flex-1 shadow-lg" @click="navTo('/statistics')">
          <!-- 修改标签 -->
          <PhChartBar weight="fill" class="w-6 h-6" />
          <span class="text-xl">统计</span>
        </GameButton>
      </div>
      
    </div>
  </MainLayout>
</template>