<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'

import CCard from '../components/CCard.vue'

const gameStore = useGameStore();

const getCharacterInfo = (character) => {
    return gameStore.allCharactersData.find(item => item.character === character)
}

const getCharacterClass = (character) => {
    const isLearned = gameStore.learnedCharacters.includes(character)
    const isMastered = gameStore.masteredCharacters.includes(character)
    return (isLearned && isMastered) ? 'ccard-mini-learned-mastered' : (isLearned ? 'ccard-mini-learned' : (isMastered ? 'ccard-mini-mastered' : ''))
}

const showingCharater = ref(null);

const showCharacterCard = (character) => {
    showingCharater.value = character
}
</script>

<template>
    <section class="ccard-mini-list">
        <span class="ccard-mini-item-wrap" v-for="i in gameStore.allCharactersData" :key="i" :class="getCharacterClass(i.character)" @click="showCharacterCard(i.character)">
            <!-- i.character为单个汉字，例如：“李”、“字”、“六”等 -->
            {{ i.character }}
        </span>
    </section>
    <van-popup v-model:show="showingCharater" :style="{ padding: '64px' }">
        <CCard v-if="showingCharater" :cInfo="getCharacterInfo(showingCharater)"></CCard>
    </van-popup>
</template>

<style scoped>
/* --- 幼儿识字游戏 - 识字列表样式 --- */

/* 列表容器：使用 Grid 布局实现响应式瀑布流 */
.ccard-mini-list {
    display: grid;
    /* 自动填充列，每列最小宽度为 80px，可根据容器宽度自动调整列数 */
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px; /* 卡片之间的间距 */
    padding: 16px; /* 列表内边距 */
    max-width: 1200px; /* 限制最大宽度，避免在超宽屏幕上过度拉伸 */
    margin: 0 auto; /* 水平居中 */
}

/* 单个汉字卡片项 */
.ccard-mini-item-wrap {
    opacity: 0.5;
    /* 使用 Flexbox 让汉字在卡片内完美居中 */
    display: flex;
    align-items: center;
    justify-content: center;

    /* 卡片尺寸与形状 */
    aspect-ratio: 1 / 1; /* 保持正方形 */
    width: 100%;
    
    /* 字体样式：大、清晰、适合儿童阅读 */
    font-size: 2.5rem;
    font-weight: bold;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
    
    /* 默认状态样式：未学习，未掌握 */
    background-color: #f5f5f5; /* 浅灰色背景 */
    color: #757575; /* 深灰色文字 */
    border-radius: 12px; /* 圆角，使其更柔和 */
    border: 2px solid #e0e0e0; /* 边框 */
    
    /* 交互性 */
    cursor: pointer;
    user-select: none; /* 防止快速点击时选中文字 */
    
    /* 平滑过渡效果，用于悬停和点击动画 */
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.3s ease;
}

/* --- 不同学习状态的样式覆盖 --- */

/* 已学习状态：柔和的蓝色系，表示“进行中” */
.ccard-mini-item-wrap.ccard-mini-learned {
    opacity: 1;
    background-color: #e3f2fd; /* 极浅蓝 */
    border-color: #90caf9; /* 浅蓝 */
    color: #1565c0; /* 深蓝 */
}

/* 已掌握状态：柔和的绿色系，表示“已完成” */
.ccard-mini-item-wrap.ccard-mini-mastered {
    opacity: 1;
    background-color: #e8f5e9; /* 极浅绿 */
    border-color: #a5d6a7; /* 浅绿 */
    color: #2e7d32; /* 深绿 */
}

/* 已学习且已掌握状态：柔和的金色/琥珀色系，表示“精通” */
.ccard-mini-item-wrap.ccard-mini-learned-mastered {
    background-color: #fff8e1; /* 极浅黄 */
    border-color: #ffcc02; /* 金色 */
    color: #f57c00; /* 深橙色 */
    font-weight: 900; /* 字体加粗，使其更突出 */
    /* 可以添加一个微妙的动画或背景效果 */
    /* animation: pulse 2s infinite; */
}

/* --- 交互状态 --- */

/* 鼠标悬停时：卡片轻微上浮并放大，增加阴影 */
.ccard-mini-item-wrap:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 鼠标按下时：卡片轻微缩小，模拟“按下”的物理反馈 */
.ccard-mini-item-wrap:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 204, 2, 0.4);
    }
    70% {
        box-shadow: 0 0 0 8px rgba(255, 204, 2, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(255, 204, 2, 0);
    }
}

</style>