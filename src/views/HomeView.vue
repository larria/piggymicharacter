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
import { PhBookOpen, PhTrophy, PhImages, PhChartBar, PhLockKey, PhDownloadSimple, PhUploadSimple } from '@phosphor-icons/vue';

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

// 【修改】删除旧的 statsText computed，直接在模板中渲染

// 4. 震动控制
const isShaking = ref(false);

// 【新增】导入相关状态
const fileInput = ref(null);
const showImportModal = ref(false);
const pendingImportData = ref(null); // 暂存解析后的数据

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

// 【修改】更新点击气泡的反馈文案
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

// 1. 导出逻辑
const handleExport = () => {
  audioManager.play('click');
  try {
    const data = gameStore.generateBackupData();
    const jsonStr = JSON.stringify(data, null, 2);

    // 创建下载链接
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 生成带时间的文件名: piggymi_save_20231201_1230.json
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

// 2. 触发导入（点击隐藏的文件输入框）
const triggerImport = () => {
  audioManager.play('click');
  if (fileInput.value) {
    fileInput.value.value = ''; // 清空，确保重复选择同一文件也能触发 change
    fileInput.value.click();
  }
};

// 3. 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      console.log('📂 开始解析文件...');
      const rawJson = JSON.parse(e.target.result);

      // 【新增】智能提取逻辑：寻找真正的存档载荷
      let targetPayload = null; // 这将指向包含 magicPoints/characterStates 的那一层
      let finalImportData = null; // 这将是我们传给 Store 的最终格式

      // 辅助检查函数：判断一个对象是否长得像存档数据
      const isPayload = (obj) => {
        return obj &&
          Array.isArray(obj.characterStates) &&
          Array.isArray(obj.collectedCards);
      };

      // 🕵️ 侦探模式：在不同层级寻找数据
      if (rawJson?.data && isPayload(rawJson.data)) {
        // 情况 1: 标准格式 { version: '1.0', data: { characterStates... } }
        console.log('✅ 识别为标准格式');
        finalImportData = rawJson;
      }
      else if (rawJson?.data?.data && isPayload(rawJson.data.data)) {
        // 情况 2: API 包装格式 { status: 0, data: { version: '1.0', data: { ... } } }
        // 你遇到的就是这种情况
        console.log('✅ 识别为 API 包装格式，已自动解包');
        finalImportData = rawJson.data;
      }
      else if (isPayload(rawJson)) {
        // 情况 3: 裸数据格式 { characterStates... } (没有 version 外壳)
        console.log('✅ 识别为裸数据格式');
        finalImportData = { data: rawJson, timestamp: Date.now() };
      }

      // 最终校验
      if (!finalImportData || !finalImportData.data) {
        console.error('❌ 结构不匹配，原始数据:', rawJson);
        throw new Error('未找到有效的存档数据 (Missing characterStates)');
      }

      console.log('🎉 数据提取成功，准备导入');
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

// 4. 确认导入
const confirmImport = () => {
  if (!pendingImportData.value) return;

  const result = gameStore.restoreBackupData(pendingImportData.value);

  if (result.success) {
    audioManager.play('celebrate');
    showImportModal.value = false;
    showToast(result.message, 'success');
    // 可选：稍微延迟后刷新页面以确保所有状态（包括store外部的潜在状态）都重置，
    // 但由于我们用了 reactive store，通常不需要刷新。
    // 这里为了最稳妥的体验，不做强制刷新，依靠 Vue 的响应式。
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
        <div class="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full p-2 pr-4 border-2 border-white shadow-sm">
          <div class="w-10 h-10 bg-candy-blue rounded-full flex items-center justify-center text-2xl">🐷</div>
          <span class="font-bold text-dark-text">咪猪头</span>
        </div>
        <!-- 【新增】数据管理按钮组 -->
        <div class="flex gap-2">
          <button @click="handleExport" class="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all text-candy-blue" title="备份存档">
            <PhDownloadSimple size="20" weight="bold" />
          </button>
          <button @click="triggerImport" class="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all text-candy-orange" title="导入存档">
            <PhUploadSimple size="20" weight="bold" />
          </button>
          <!-- 隐藏的文件输入 -->
          <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange">
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

        <!-- 统计按钮 -->
        <div class="flex-1 relative group">
          <GameButton variant="info" class="w-full shadow-lg" @click="navTo('/statistics')">
            <PhChartBar weight="fill" class="w-6 h-6" />
            <span class="text-xl">统计</span>
          </GameButton>

          <!-- 
             【修改】统计数据胶囊气泡
             内容：已初识(蓝) / 已掌握(绿)
             样式：保留紫色边框，内部文字颜色独立
           -->
          <div class="absolute -top-4 -right-2 z-10 cursor-pointer transition-transform hover:scale-105 active:scale-95" @click.stop="showStatsInfo">
            <div class="bg-white border-2 border-candy-purple rounded-full px-3 h-8 flex items-center justify-center shadow-md text-sm font-bold whitespace-nowrap gap-1">
              <!-- 已初识：蓝色 -->
              <span class="text-candy-blue text-base">{{ gameStore.learnedCharacters.length }}</span>
              <!-- 分隔符：浅灰 -->
              <span class="text-gray-300">/</span>
              <!-- 已掌握：绿色 -->
              <span class="text-candy-green text-base">{{ gameStore.masteredCharacters.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <GameModal :show="showImportModal" title="恢复存档" @close="showImportModal = false">
      <div class="text-center space-y-6 px-4">
        <div class="text-6xl animate-bounce-sm">📂</div>
        <div class="text-gray-600 text-lg">
          <p>确定要导入这个存档吗？</p>
          <p class="text-sm text-candy-red font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
            ⚠️ 警告：当前的游戏进度将被覆盖且无法找回！
          </p>
          <!-- 简单的预览信息 -->
          <div v-if="pendingImportData" class="mt-4 text-left bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
            <p>📅 存档时间: {{ new Date(pendingImportData.timestamp || Date.now()).toLocaleString() }}</p>
            <!-- 使用 ?. 确保 data 存在，|| 0 确保显示数字 -->
            <p>✨ 魔力值: {{ pendingImportData.data?.magicPoints || 0 }}</p>
            <!-- 关键修改：加上 ?. 防止 characterStates 为 undefined 时读取 length 报错 -->
            <p>📚 总共记录: {{ pendingImportData.data?.characterStates?.length || 0 }} 个字</p>
          </div>
        </div>
        <div class="flex justify-center gap-4">
          <GameButton variant="secondary" @click="showImportModal = false">取消</GameButton>
          <GameButton variant="danger" @click="confirmImport">确认覆盖</GameButton>
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
</style>