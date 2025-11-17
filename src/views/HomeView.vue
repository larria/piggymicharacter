<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { showToast } from 'vant'
import Utils from '../Utils.js';

import ProgressRing from '../components/ProgressRing.vue'

const router = useRouter()
const gameStore = useGameStore()

// 是否可以测验
const canStartExam = computed(() => {
  return gameStore.learnedCharacters.length > 0;
});

const goToStudy = async () => {
  if (gameStore.getTodayLearnCount() >= gameStore.DAILY_LEARN_LIMIT) {
    showToast('🐷 咪猪头今天的学习任务已经全部完成～')
    await Utils.speakText('太棒了！咪猪头今天的学习任务已经全部完成～', {
      lang: 'zh-CN',
    });
    return
  }
  router.push('/study')
}

const goToExam = () => {
  if (!canStartExam.value) {
    showToast('🐷 还没有初识的字，先去学习一下吧～');
    return;
  }
  if (gameStore.getTodayMasterCount() >= gameStore.DAILY_MASTER_LIMIT) {
    showToast('🐷 今天的掌握名额已经用完啦，明天再来吧～');
    return;
  }
  router.push('/exam');
}

const goToCollection = () => {
  router.push('/collection')
}

const goToStatistics = () => {
  router.push('/statistics')
}

onUnmounted(() => {
  Utils.stopSpeak();
})
</script>

<template>
  <main>
    <div class="button" @click="goToStudy">
      <h3>识字学习</h3>
      <p>开始新字的初识</p>
      <ProgressRing :progress="gameStore.getTodayLearnCount() / gameStore.DAILY_LEARN_LIMIT * 100" :text="gameStore.getTodayLearnCount() + '/' + gameStore.DAILY_LEARN_LIMIT" size=50></ProgressRing>
    </div>
    <div class="button" :class="{ disabled: !canStartExam }" @click="goToExam">
      <h3>复习游戏</h3>
      <p>巩固已学内容</p>
      <!-- <span class="badge">今日：{{ gameStore.getTodayMasterCount() }} / {{ gameStore.DAILY_MASTER_LIMIT }}</span> -->
      <ProgressRing :progress="gameStore.getTodayMasterCount() / gameStore.DAILY_MASTER_LIMIT * 100" :text="gameStore.getTodayMasterCount() + '/' + gameStore.DAILY_MASTER_LIMIT" size=50></ProgressRing>
    </div>
    <div class="button" @click="goToCollection">
      <h3>画片收藏</h3>
      <p>查看收集的画片</p>
      <span class="badge">已收集：{{ gameStore.collectedCards.length }}</span>
    </div>
    <div class="button" @click="goToStatistics">
      <h3>学习统计</h3>
      <p>详细数据分析</p>
    </div>
  </main>
</template>

<style scoped>
/* 样式保持不变 */
main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

.button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-align: center;
  min-height: 120px;
}

.button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.button:not(.disabled):hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  border-color: #4a90e2;
  background: #f8fbff;
}

.button:not(.disabled):active {
  transform: translateY(-2px);
  transition: all 0.1s ease;
}

.button h3 {
  margin: 0 0 10px 0;
  font-size: 1.4em;
  color: #2c3e50;
  font-weight: 600;
}

.button p {
  margin: 0 0 20px;
  font-size: 0.95em;
  color: #7f8c8d;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  main {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 15px;
    padding: 15px;
  }

  .button {
    padding: 25px 15px;
    min-height: 100px;
  }

  .button h3 {
    font-size: 1.3em;
  }
}
</style>