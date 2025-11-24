<script setup>
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { PhLockKey, PhArrowLeft, PhImages, PhBookOpen, PhSword, PhXCircle, PhMagnifyingGlassPlus } from '@phosphor-icons/vue';
import { showToast } from 'vant';
import confetti from 'canvas-confetti';

import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';
import GameModal from '@/components/base/GameModal.vue';

const router = useRouter();
const gameStore = useGameStore();

const pCardTotalLen = 48;
const selectedCardId = ref(null);
const showUnlockModal = ref(false);
// 引导弹窗
const showGuideModal = ref(false);
const guideType = ref('');

// --- 图片预览手势相关状态 ---
const showPreviewViewer = ref(false);
const viewerState = reactive({
  scale: 1,
  panning: false,
  pointX: 0,
  pointY: 0,
  startX: 0,
  startY: 0,
  startScale: 1
});
// 记录双指初始距离
let startDistance = 0;

// 生成卡片列表
const cardList = Array.from({ length: pCardTotalLen }, (_, i) => i);
const isCollected = (id) => gameStore.collectedCards.includes(id);
const getImgUrl = (id) => new URL(`../assets/images/cards/c${id}.jpg`, import.meta.url).href;

// 点击卡片
const handleCardClick = (id) => {
  selectedCardId.value = id;
  audioManager.play('click');

  if (isCollected(id)) {
    openImageViewer(); // 打开新的查看器
    return;
  }

  if (gameStore.magicPoints >= gameStore.CARD_COST) {
    showUnlockModal.value = true;
  } else {
    audioManager.play('wrong');
    checkAndGuide();
  }
};

// --- 手势查看器逻辑 Start ---

const openImageViewer = () => {
  // 重置状态
  viewerState.scale = 1;
  viewerState.pointX = 0;
  viewerState.pointY = 0;
  showPreviewViewer.value = true;
};

const closeImageViewer = () => {
  showPreviewViewer.value = false;
};

// 计算两点距离
const getDistance = (touches) => {
  return Math.hypot(
    touches[0].pageX - touches[1].pageX,
    touches[0].pageY - touches[1].pageY
  );
};

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    // 双指：开始缩放
    viewerState.panning = false;
    startDistance = getDistance(e.touches);
    viewerState.startScale = viewerState.scale;
  } else if (e.touches.length === 1) {
    // 单指：开始拖拽 (只有当放大后才允许拖拽，提升体验)
    if (viewerState.scale > 1) {
      viewerState.panning = true;
      viewerState.startX = e.touches[0].pageX - viewerState.pointX;
      viewerState.startY = e.touches[0].pageY - viewerState.pointY;
    }
  }
};

const handleTouchMove = (e) => {
  e.preventDefault(); // 阻止浏览器默认行为

  if (e.touches.length === 2) {
    // 双指缩放
    const currentDistance = getDistance(e.touches);
    if (startDistance === 0) return;

    const newScale = viewerState.startScale * (currentDistance / startDistance);
    // 限制缩放范围 (1倍 到 4倍)
    viewerState.scale = Math.min(Math.max(1, newScale), 4);

  } else if (e.touches.length === 1 && viewerState.panning) {
    // 单指拖拽
    viewerState.pointX = e.touches[0].pageX - viewerState.startX;
    viewerState.pointY = e.touches[0].pageY - viewerState.startY;
  }
};

const handleTouchEnd = () => {
  viewerState.panning = false;
  // 如果缩小到比1还小，自动回弹
  if (viewerState.scale < 1) {
    viewerState.scale = 1;
    viewerState.pointX = 0;
    viewerState.pointY = 0;
  }
};

// 双击重置
const handleDoubleTap = () => {
  if (viewerState.scale > 1) {
    viewerState.scale = 1;
    viewerState.pointX = 0;
    viewerState.pointY = 0;
  } else {
    viewerState.scale = 2.5; // 双击放大
  }
};

// --- 手势查看器逻辑 End ---

// 检查配额并引导
const checkAndGuide = () => {
  const canLearn = gameStore.unlearnedCharacters.length > 0 &&
    gameStore.getTodayLearnCount() < gameStore.DAILY_LEARN_LIMIT;
  const canExam = gameStore.learnedCharacters.length > 0 &&
    gameStore.getTodayMasterCount() < gameStore.DAILY_MASTER_LIMIT;

  if (canLearn) {
    guideType.value = 'study';
    showGuideModal.value = true;
  } else if (canExam) {
    guideType.value = 'exam';
    showGuideModal.value = true;
  } else {
    showToast('魔力值不足，且今日任务已全完成。\n早点休息，明天再来领取奖励吧！🌙');
  }
};

const handleGuideAction = () => {
  showGuideModal.value = false;
  if (guideType.value === 'study') {
    router.push('/study');
  } else {
    router.push('/exam');
  }
};

const confirmUnlock = () => {
  if (gameStore.magicPoints >= gameStore.CARD_COST) {
    const res = gameStore.exchangeCard(selectedCardId.value);
    if (res.success) {
      audioManager.play('unlock');
      showUnlockModal.value = false;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('解锁成功！');
      setTimeout(() => {
        openImageViewer();
      }, 500);
    }
  }
};
</script>

<template>
  <MainLayout bgImage="bg_museum.jpg">
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <button @click="router.push('/')" class="p-2 bg-white/50 rounded-full hover:bg-white transition">
          <PhArrowLeft size="24" />
        </button>
        <div class="bg-white/80 px-4 py-1 rounded-full font-bold text-candy-orange flex items-center gap-2">
          <PhImages size="20" weight="fill" />
          <span>已收集 {{ gameStore.collectedCards.length }} / {{ pCardTotalLen }}</span>
        </div>
        <MagicCapsule />
      </div>
    </template>

    <div class="flex-1 overflow-y-auto p-2 pb-20 no-scrollbar">
      <div class="grid grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="id in cardList" :key="id" class="aspect-square rounded-xl relative overflow-hidden shadow-md border-2 border-white cursor-pointer transition transform hover:scale-105 active:scale-95 bg-gray-100" @click="handleCardClick(id)">
          <img :src="getImgUrl(id)" loading="lazy" class="w-full h-full object-cover transition duration-500" :class="isCollected(id) ? 'blur-0' : 'blur-md grayscale opacity-60'" />
          <div v-if="!isCollected(id)" class="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
            <PhLockKey size="32" weight="fill" class="text-white drop-shadow-lg mb-1" />
            <span class="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded-full">{{ gameStore.CARD_COST }}✨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 解锁确认弹窗 (保持 GameModal) -->
    <GameModal :show="showUnlockModal" title="解锁画片" @close="showUnlockModal = false">
      <div class="text-center space-y-6">
        <p class="text-lg text-gray-600">是否消耗 <span class="font-bold text-candy-orange text-xl">{{ gameStore.CARD_COST }}</span> 魔力值解锁这张画片？</p>
        <div class="flex justify-center gap-4">
          <GameButton variant="secondary" @click="showUnlockModal = false">再想想</GameButton>
          <GameButton variant="success" @click="confirmUnlock">确定解锁</GameButton>
        </div>
      </div>
    </GameModal>

    <!-- 任务引导弹窗 (保持 GameModal) -->
    <GameModal :show="showGuideModal" title="魔力值不足" @close="showGuideModal = false">
      <div class="text-center space-y-6">
        <div class="text-6xl">🤔</div>
        <p class="text-lg text-gray-600 px-4">
          <span v-if="guideType === 'study'">想解锁画片吗？<br>去认识新汉字可以获得魔力哦！</span>
          <span v-else>想解锁画片吗？<br>去挑战怪兽可以赢取魔力哦！</span>
        </p>
        <div class="flex justify-center gap-4">
          <GameButton variant="secondary" @click="showGuideModal = false">暂不</GameButton>
          <GameButton v-if="guideType === 'study'" variant="primary" @click="handleGuideAction">
            <PhBookOpen weight="bold" class="mr-2" />去学习
          </GameButton>
          <GameButton v-else variant="danger" @click="handleGuideAction">
            <PhSword weight="bold" class="mr-2" />去挑战
          </GameButton>
        </div>
      </div>
    </GameModal>

    <!-- 【新增】全屏图片手势查看器 -->
    <Transition name="viewer-fade">
      <div v-if="showPreviewViewer" class="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center overflow-hidden touch-none">
        <!-- 关闭按钮 -->
        <button @click="closeImageViewer" class="absolute top-6 right-6 z-50 text-white/80 hover:text-white transition transform hover:scale-110">
          <PhXCircle size="48" weight="fill" />
        </button>

        <!-- 提示文字 (仅当比例为1时显示) -->
        <div v-if="viewerState.scale === 1" class="absolute bottom-10 left-0 w-full text-center text-white/50 pointer-events-none animate-pulse">
          <div class="flex items-center justify-center gap-2">
            <PhMagnifyingGlassPlus size="20" />
            <span>双指张开放大 / 双击切换</span>
          </div>
        </div>

        <!-- 图片容器 -->
        <div class="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
          <!-- 
             Transform 逻辑：
             1. translate: 控制位移
             2. scale: 控制缩放
             transition: 如果不在拖拽中，给予平滑过渡(用于双击或回弹)
          -->
          <img v-if="selectedCardId !== null" :src="getImgUrl(selectedCardId)" class="max-w-full max-h-full object-contain shadow-2xl origin-center" :class="{ 'transition-all duration-300': !viewerState.panning && viewerState.scale === 1 }" :style="{
            transform: `translate(${viewerState.pointX}px, ${viewerState.pointY}px) scale(${viewerState.scale})`
          }" @dblclick="handleDoubleTap" />
          <!-- 注意：Web端 dblclick 在 iPad 上通常需要快速点击两次，也可以自己实现 tap 计数 -->
        </div>
      </div>
    </Transition>

  </MainLayout>
</template>

<style scoped>
/* 查看器淡入淡出 */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.3s ease;
}
.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

/* 强制该容器不响应默认触控，交由 JS 处理 */
.touch-none {
  touch-action: none;
}
</style>