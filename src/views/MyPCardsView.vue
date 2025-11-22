<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { PhLockKey, PhArrowLeft, PhImages, PhBookOpen, PhSword } from '@phosphor-icons/vue';
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
const showPreviewModal = ref(false);

// 【新增】引导弹窗状态
const showGuideModal = ref(false);
const guideType = ref(''); // 'study' | 'exam'

// 生成卡片列表
const cardList = Array.from({ length: pCardTotalLen }, (_, i) => i);

const isCollected = (id) => gameStore.collectedCards.includes(id);

const handleCardClick = (id) => {
  selectedCardId.value = id;
  audioManager.play('click');
  
  // 1. 如果已解锁，直接看大图
  if (isCollected(id)) {
    showPreviewModal.value = true;
    return;
  } 
  
  // 2. 如果未解锁，检查魔力值
  if (gameStore.magicPoints >= gameStore.CARD_COST) {
    // 魔力值足够 -> 弹出解锁确认
    showUnlockModal.value = true;
  } else {
    // 魔力值不足 -> 进入引导逻辑
    audioManager.play('wrong');
    checkAndGuide();
  }
};

// 【新增】检查配额并引导
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
    // 都没有名额了
    showToast('魔力值不足，且今日任务已全完成。\n早点休息，明天再来领取奖励吧！🌙');
  }
};

// 【新增】执行跳转
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
        showPreviewModal.value = true;
      }, 500);
    }
  }
};

const getImgUrl = (id) => new URL(`../assets/images/cards/c${id}.jpg`, import.meta.url).href;
</script>

<template>
  <MainLayout bgImage="bg_museum.jpg">
    <!-- header 和 content 保持不变 ... -->
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
        <div 
          v-for="id in cardList" 
          :key="id" 
          class="aspect-square rounded-xl relative overflow-hidden shadow-md border-2 border-white cursor-pointer transition transform hover:scale-105 active:scale-95 bg-gray-100"
          @click="handleCardClick(id)"
        >
          <img 
            :src="getImgUrl(id)" 
            loading="lazy"
            class="w-full h-full object-cover transition duration-500"
            :class="isCollected(id) ? 'blur-0' : 'blur-md grayscale opacity-60'"
          />
          <div v-if="!isCollected(id)" class="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
            <PhLockKey size="32" weight="fill" class="text-white drop-shadow-lg mb-1" />
            <span class="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded-full">{{ gameStore.CARD_COST }}✨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 原有：解锁弹窗 -->
    <GameModal :show="showUnlockModal" title="解锁画片" @close="showUnlockModal = false">
      <div class="text-center space-y-6">
        <p class="text-lg text-gray-600">是否消耗 <span class="font-bold text-candy-orange text-xl">{{ gameStore.CARD_COST }}</span> 魔力值解锁这张画片？</p>
        <div class="flex justify-center gap-4">
          <GameButton variant="secondary" @click="showUnlockModal = false">再想想</GameButton>
          <GameButton variant="success" @click="confirmUnlock">确定解锁</GameButton>
        </div>
      </div>
    </GameModal>

    <!-- 原有：大图预览弹窗 -->
    <GameModal :show="showPreviewModal" title="画片欣赏" @close="showPreviewModal = false">
      <div class="rounded-xl overflow-hidden shadow-inner">
        <img v-if="selectedCardId !== null" :src="getImgUrl(selectedCardId)" class="w-full h-auto" />
      </div>
      <div class="text-center mt-4">
        <GameButton variant="primary" size="sm" @click="showPreviewModal = false">好看！</GameButton>
      </div>
    </GameModal>

    <!-- 【新增】任务引导弹窗 -->
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

  </MainLayout>
</template>