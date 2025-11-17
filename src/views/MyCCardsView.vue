<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import confetti from 'canvas-confetti'

import CCard from '../components/CCard.vue'
import PageHeader from '../components/PageHeader.vue'
import { useGameStore } from '@/stores/game'
import MiniCCardList from '../components/MiniCCardList.vue'

const router = useRouter()
const gameStore = useGameStore()
</script>

<template>
  <PageHeader>
    <template #center>
      <div class="study-head-center">
        <h2>成就统计</h2>
        <!-- <p class="character-progress">{{ currentCharacterIndex + 1 }} / {{ charactersToLearn.length }}</p> -->
      </div>
    </template>
  </PageHeader>
  <div class="ccards-wrap">
    <div class="static-wrap">
      <p class="static-item">已初识 {{ gameStore.learnedCharacters.length }} / {{ gameStore.allCharactersData.length }}</p>
      <p class="static-item">已掌握 {{ gameStore.masteredCharacters.length }} / {{ gameStore.allCharactersData.length }}</p>
      <p class="static-tips">学习要有恒心，坚持努力吧！</p>
    </div>
    <MiniCCardList />
  </div>
</template>

<style>
h2 {
  font-size: 30px;
}

.ccards-wrap {
  margin-top: 20px;
  flex:1;
  overflow-y: auto;
}

/* --- 统计面板样式 --- */
.static-wrap {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 10px 20px; /* 调整内边距，使其更适合一行布局 */
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    
    /* 核心：使用 Flexbox 实现一行布局 */
    display: flex;
    align-items: center;         /* 垂直方向居中对齐 */
    justify-content: space-between;     /* 水平方向居中，元素环绕分布 */
    flex-wrap: wrap;             /* 在极窄屏幕下允许换行，防止内容溢出 */
    gap: 20px;                   /* 统一使用 gap 控制元素间距 */

    width: 100%;
    box-sizing: border-box;
}

/* 单行统计信息 */
.static-item {
    font-size: 1.25rem;
    color: #333;
    /* 移除原有的 margin，因为现在由 gap 控制间距 */
    font-weight: 500;
    white-space: nowrap; /* 防止数字和文字在极小空间内意外换行 */
}

/* 激励性提示文字 */
.static-tips {
    font-size: 1rem;
    color: #888;
    font-style: italic;
    /* 移除原有的 margin-top */
    
    /* 添加左右装饰符，使其在视觉上更像一个分隔符 */
    position: relative;
    padding: 0 20px; /* 为装饰符留出空间 */
}

/* 使用伪元素创建装饰符 */
.static-tips::before,
.static-tips::after {
    content: '•'; /* 使用圆点作为装饰 */
    color: #ddd;   /* 淡化装饰符颜色 */
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
}

.static-tips::before {
    left: 0;
}

.static-tips::after {
    right: 0;
}
</style>
