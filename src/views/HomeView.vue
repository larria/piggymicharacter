<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { showToast } from '@/utils/gameToast';
import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';
import GameModal from '@/components/base/GameModal.vue';
// 引入图标 (新增 PhKey)
import { PhBookOpen, PhTrophy, PhImages, PhChartBar, PhLockKey, PhDownloadSimple, PhUploadSimple, PhKey } from '@phosphor-icons/vue';

const router = useRouter();
const gameStore = useGameStore();

// ====================== 资源引用 ======================
// 动态引入头像，确保构建时能正确处理路径
const avatarUrl = new URL('@/assets/images/piggy-mi.png', import.meta.url).href;

// ====================== 状态与计算属性 ======================

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

// 3. 动画状态
const isShaking = ref(false);
const isAvatarAnimating = ref(false); // 头像动画状态

// 4. 导入导出相关状态
const fileInput = ref(null);
const showImportModal = ref(false);
const pendingImportData = ref(null);

// 5. 【新增】家长模式状态
const showParentModal = ref(false);
const parentPassword = ref('');

// ====================== 交互逻辑 ======================

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => isShaking.value = false, 500);
};

// 点击头像的互动逻辑
const handleAvatarClick = () => {
  // 1. 播放动效
  if (isAvatarAnimating.value) return;
  isAvatarAnimating.value = true;

  // 2. 播放音效 (correct 音效比较神奇可爱，适合作为互动音)
  audioManager.play('correct');

  // 3. 生成加油语
  const messages = [
    '你好呀！爸爸的咪猪头 🐷',
    '今天也要开心学习哦！✨',
    '你真棒！已经认识这么多字了！📚',
    '坚持就是胜利，加油加油！💪',
    '我是你最好的识字伙伴！🌟'
  ];

  // 根据进度追加特殊夸奖
  const totalLearned = gameStore.learnedCharacters.length;
  const totalMastered = gameStore.masteredCharacters.length;

  let dynamicMsg = messages[Math.floor(Math.random() * messages.length)]; // 默认随机

  if (gameStore.getTodayMasterCount() >= 5) {
    dynamicMsg = '今天学得太棒了，给你点赞！👍';
  } else if (totalMastered > 50) {
    dynamicMsg = `哇！你已经掌握 ${totalMastered} 个汉字啦！天才！🏆`;
  } else if (totalLearned === 0) {
    dynamicMsg = '欢迎来到识字世界，快去认识新朋友吧！🎈';
  }

  showToast(dynamicMsg, 'success');

  // 4. 动画复位
  setTimeout(() => {
    isAvatarAnimating.value = false;
  }, 1000); // 配合 CSS 动画时长
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

const showStatsInfo = () => {
  audioManager.play('click');
  showToast('进度：已初识(蓝) / 已掌握(绿)');
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

// ====================== 【新增】家长模式逻辑 ======================

const openParentModal = () => {
  audioManager.play('click');
  parentPassword.value = ''; // 重置密码
  showParentModal.value = true;
};

const checkPassword = () => {
  if (parentPassword.value === '271911') {
    audioManager.play('unlock'); // 播放解锁音效
    showParentModal.value = false;
    router.push('/parents-god-mode');
  } else {
    audioManager.play('wrong');
    showToast('密码错误，请重试', 'error');
    parentPassword.value = ''; // 清空方便重试
  }
};

// ====================== 存档管理逻辑 ======================

const handleExport = () => {
  audioManager.play('click');
  try {
    const data = gameStore.generateBackupData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 5).replace(/:/g, '');
    const filename = `piggymi_save_${dateStr}_${timeStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('存档已下载到本地', 'success');
  } catch (e) {
    console.error(e);
    showToast('导出失败', 'error');
  }
};

const triggerImport = () => {
  audioManager.play('click');
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      console.log('📂 开始解析文件...');
      const rawJson = JSON.parse(e.target.result);

      let finalImportData = null;
      const isPayload = (obj) => obj && Array.isArray(obj.characterStates) && Array.isArray(obj.collectedCards);

      if (rawJson?.data && isPayload(rawJson.data)) {
        finalImportData = rawJson;
      } else if (rawJson?.data?.data && isPayload(rawJson.data.data)) {
        finalImportData = rawJson.data;
      } else if (isPayload(rawJson)) {
        finalImportData = { data: rawJson, timestamp: Date.now() };
      }

      if (!finalImportData || !finalImportData.data) {
        throw new Error('未找到有效的存档数据');
      }

      pendingImportData.value = finalImportData;
      showImportModal.value = true;
    } catch (err) {
      console.error('💥 导入错误:', err);
      audioManager.play('wrong');
      showToast('文件格式错误：无法识别存档数据', 'error');
    } finally {
      if (fileInput.value) fileInput.value.value = '';
    }
  };
  reader.readAsText(file);
};

const confirmImport = () => {
  if (!pendingImportData.value) return;
  const result = gameStore.restoreBackupData(pendingImportData.value);
  if (result.success) {
    audioManager.play('celebrate');
    showImportModal.value = false;
    showToast(result.message, 'success');
  } else {
    audioManager.play('wrong');
    showToast(result.message, 'error');
  }
};
</script>

<template>
  <MainLayout bgImage="bg_world_map.jpg">
    <!-- 顶部栏 -->
    <template #header>
      <div class="flex items-center gap-4 w-full justify-between">
        <!-- 左侧区域：头像 + 存档按钮 + 家长按钮 -->
        <div class="flex items-center gap-4">

          <!-- 咪猪头头像按钮 -->
          <button @click="handleAvatarClick" class="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full p-1.5 pr-4 border-2 border-white shadow-md transition-transform hover:scale-105 active:scale-95 group relative overflow-hidden" :class="{ 'animate-jello': isAvatarAnimating }">
            <div class="w-11 h-11 rounded-full border-2 border-candy-blue overflow-hidden bg-white shadow-inner relative z-10">
              <img :src="avatarUrl" alt="咪猪头" class="w-full h-full object-cover group-hover:rotate-12 transition-transform duration-300" />
            </div>

            <span class="font-bold text-dark-text text-lg relative z-10">咪猪头</span>

            <!-- 装饰性背景光效 -->
            <div class="absolute inset-0 bg-gradient-to-r from-candy-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <!-- 数据管理按钮组 -->
          <div class="flex gap-2">
            <button @click="handleExport" class="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all text-candy-blue" title="备份存档">
              <PhDownloadSimple size="20" weight="bold" />
            </button>
            <button @click="triggerImport" class="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all text-candy-orange" title="导入存档">
              <PhUploadSimple size="20" weight="bold" />
            </button>
            <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange">

            <!-- 【新增】家长金手指入口 -->
            <button @click="openParentModal" class="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all text-candy-purple" title="家长模式">
              <PhKey size="20" weight="fill" />
            </button>
          </div>
        </div>

        <MagicCapsule />
      </div>
    </template>

    <!-- 中央地图区域 (保持不变) -->
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
        <GameButton variant="warning" class="flex-1 shadow-lg" @click="navTo('/collection')">
          <PhImages weight="fill" class="w-6 h-6" />
          <span class="text-xl">画片</span>
        </GameButton>

        <div class="flex-1 relative group">
          <GameButton variant="info" class="w-full shadow-lg" @click="navTo('/statistics')">
            <PhChartBar weight="fill" class="w-6 h-6" />
            <span class="text-xl">统计</span>
          </GameButton>
          <div class="absolute -top-4 -right-2 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" @click.stop="showStatsInfo">
            <div class="bg-white border-2 border-candy-purple rounded-full px-3 h-8 flex items-center justify-center shadow-md text-sm font-bold whitespace-nowrap gap-1">
              <span class="text-candy-blue text-base">{{ gameStore.learnedCharacters.length }}</span>
              <span class="text-gray-300">/</span>
              <span class="text-candy-green text-base">{{ gameStore.masteredCharacters.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入确认弹窗 -->
    <GameModal :show="showImportModal" title="恢复存档" @close="showImportModal = false">
      <div class="text-center space-y-6 px-4">
        <div class="text-6xl animate-bounce-sm">📂</div>
        <div class="text-gray-600 text-lg">
          <p>确定要导入这个存档吗？</p>
          <p class="text-sm text-candy-red font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
            ⚠️ 警告：当前的游戏进度将被覆盖且无法找回！
          </p>
          <div v-if="pendingImportData" class="mt-4 text-left bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
            <p>📅 存档时间: {{ new Date(pendingImportData.timestamp || Date.now()).toLocaleString() }}</p>
            <p>✨ 魔力值: {{ pendingImportData.data?.magicPoints || 0 }}</p>
            <p>📚 已初识: {{ pendingImportData.data?.characterStates?.length || 0 }} 个字</p>
          </div>
        </div>
        <div class="flex justify-center gap-4">
          <GameButton variant="secondary" @click="showImportModal = false">取消</GameButton>
          <GameButton variant="danger" @click="confirmImport">确认覆盖</GameButton>
        </div>
      </div>
    </GameModal>

    <!-- 【新增】家长密码弹窗 -->
    <GameModal :show="showParentModal" title="家长验证" @close="showParentModal = false">
      <div class="flex flex-col items-center gap-6 px-4 py-2">
        <div class="text-gray-600 text-center font-bold">
          请输入密码进入管理后台
        </div>

        <!-- 密码输入框 -->
        <div class="relative w-full max-w-[220px]">
          <input v-model="parentPassword" type="tel" maxlength="6" class="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border-b-4 border-candy-blue outline-none bg-transparent focus:border-candy-purple transition-colors text-dark-text placeholder-gray-300" placeholder="••••••" />
        </div>

        <div class="flex gap-4 w-full justify-center">
          <GameButton variant="secondary" @click="showParentModal = false">取消</GameButton>
          <GameButton variant="primary" @click="checkPassword">确认</GameButton>
        </div>
      </div>
    </GameModal>

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

/* 果冻特效动画：点击头像时触发 */
.animate-jello {
  animation: jello-horizontal 0.9s both;
}

@keyframes jello-horizontal {
  0% {
    transform: scale3d(1, 1, 1);
  }
  30% {
    transform: scale3d(1.25, 0.75, 1);
  }
  40% {
    transform: scale3d(0.75, 1.25, 1);
  }
  50% {
    transform: scale3d(1.15, 0.85, 1);
  }
  65% {
    transform: scale3d(0.95, 1.05, 1);
  }
  75% {
    transform: scale3d(1.05, 0.95, 1);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}
</style>