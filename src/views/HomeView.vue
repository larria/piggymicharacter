<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { showToast } from 'vant'

const router = useRouter()
const gameStore = useGameStore()


const goToStudy = () => {
  // if (unlearnedCount.value === 0) {
  //   alert('所有字都已经学习过了！')
  //   return
  // }
  router.push('/study')
}

const goToExam = () => {
  // TODO
  showToast('🐷 这个功能爸爸还在做，咪猪头很快就能玩到了哦～')
  // router.push('/exam')
}

const goToCollection = () => {
  router.push('/collection')
}

const goToStatistics = () => {
  // TODO
  showToast('🐷 这个功能爸爸还在做，咪猪头很快就能玩到了哦～')
  // router.push('/statistics')
}
</script>

<template>
  <main>
    <div class="button" @click="goToStudy">
      <h3>识字学习</h3>
      <p>开始新字的初识</p>
      <span class="badge">今日：{{ gameStore.getTodayLearnCount() }} / 30</span>
    </div>
    <div class="button disabled" @click="goToExam">
      <h3>复习游戏</h3>
      <p>巩固已学内容</p>
      <span class="badge">今日：{{ gameStore.getTodayMasterCount() }} / 30</span>
    </div>
    <div class="button" @click="goToCollection">
      <h3>画片收藏</h3>
      <p>查看收集的画片</p>
      <span class="badge">已收集：{{ gameStore.collectedCards.length }}</span>
    </div>
    <div class="button disabled" @click="goToStatistics">
      <h3>学习统计</h3>
      <p>详细数据分析</p>
    </div>
  </main>
</template>

<style scoped>
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
  opacity: 0.8;
}

.button:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  border-color: #4a90e2;
  background: #f8fbff;
}

.button:active {
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
  margin: 0;
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
