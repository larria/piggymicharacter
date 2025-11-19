<script setup>
import { ref } from 'vue'; // 引入 ref
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio'; // 引入音频管理
import { PhArrowLeft, PhStudent, PhMedal } from '@phosphor-icons/vue';
import MainLayout from '@/components/layout/MainLayout.vue';
// 【新增】引入通用组件
import GameModal from '@/components/base/GameModal.vue';
import CharLearningCard from '@/components/business/CharLearningCard.vue';

const router = useRouter();
const gameStore = useGameStore();

// 【新增】预览状态
const showPreview = ref(false);
const previewInfo = ref(null);

const getStatusClass = (char) => {
  if (gameStore.masteredCharacters.includes(char)) return 'bg-candy-green text-white border-emerald-600 shadow-md';
  if (gameStore.learnedCharacters.includes(char)) return 'bg-candy-blue text-white border-blue-600 shadow-md';
  // 未学状态优化：加个 hover 效果暗示可点击
  return 'bg-gray-50 text-gray-400 border-gray-200 hover:border-candy-blue hover:text-candy-blue hover:bg-white'; 
};

// 【新增】点击汉字处理
const handleCharClick = (item) => {
  previewInfo.value = item;
  showPreview.value = true;
  audioManager.play('click');
};
</script>

<template>
  <MainLayout bgImage="bg_common.jpg">
    <template #header>
      <div class="flex items-center gap-4 w-full">
        <button @click="router.push('/')" class="p-2 bg-white/50 rounded-full hover:bg-white transition">
          <PhArrowLeft size="24" />
        </button>
        <div class="text-xl font-bold text-dark-text">学习足迹</div>
      </div>
    </template>

    <div class="flex-1 overflow-y-auto p-2 no-scrollbar">
      <!-- 顶部数据卡 (保持不变) -->
      <div class="flex gap-4 mb-6">
        <div class="flex-1 bg-white/80 rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <PhStudent size="32" class="text-candy-blue mb-2" weight="duotone"/>
          <span class="text-3xl font-bold text-dark-text">{{ gameStore.learnedCharacters.length }}</span>
          <span class="text-xs text-gray-500">已初识</span>
        </div>
        <div class="flex-1 bg-white/80 rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <PhMedal size="32" class="text-candy-green mb-2" weight="duotone"/>
          <span class="text-3xl font-bold text-dark-text">{{ gameStore.masteredCharacters.length }}</span>
          <span class="text-xs text-gray-500">已掌握</span>
        </div>
      </div>

      <!-- 汉字墙 -->
      <div class="bg-white/60 backdrop-blur rounded-3xl p-6 shadow-inner min-h-[300px]">
        <h3 class="font-bold text-gray-600 mb-4">所有汉字 (点击查看)</h3>
        <div class="flex flex-wrap gap-3 justify-center">
          <!-- 【修改】添加点击事件，优化鼠标样式 -->
          <div 
            v-for="item in gameStore.allCharactersData" 
            :key="item.character"
            class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-b-4 transition transform hover:scale-110 cursor-pointer active:scale-95"
            :class="getStatusClass(item.character)"
            @click="handleCharClick(item)"
          >
            {{ item.character }}
          </div>
        </div>
      </div>
    </div>

    <!-- 【新增】汉字详情弹窗 -->
    <GameModal :show="showPreview" title="汉字详情" @close="showPreview = false">
      <div class="flex justify-center py-2">
        <!-- 复用卡片组件：
             1. :key 确保切换汉字时组件彻底重载
             2. :autoPlay="true" 打开自动读一遍
             3. 这里不绑定 @finish，因为是预览模式，不需要出现“我学会了”按钮
        -->
        <CharLearningCard 
          v-if="previewInfo"
          :key="previewInfo.character"
          :info="previewInfo"
          :autoPlay="true"
        />
      </div>
    </GameModal>

  </MainLayout>
</template>