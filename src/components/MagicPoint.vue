<script setup>
import { ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
// 控制动画状态的变量
const isAnimating = ref(false)

// 监听魔法值变化，触发动画
watch(
    () => gameStore.magicPoints,
    (newVal, oldVal) => {
        if (newVal !== oldVal) {
            // 启动动画
            isAnimating.value = true
            // 动画结束后重置状态（时长需与CSS动画保持一致）
            setTimeout(() => {
                isAnimating.value = false
            }, 300)
        }
    }
)
</script>

<template>
    <section class="magicpoint-wrap">
        <span class="magic-icon"></span>
        <!-- 绑定动画类 -->
        <span class="magic-text" :class="{ 'animate': isAnimating }">
            {{ gameStore.magicPoints }}
        </span>
    </section>
</template>

<style scoped>
.magicpoint-wrap {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
}
.magic-icon {
    width: 30px;
    height: 30px;
    background-image: url(../assets/images/style/icon_power.png);
    background-size: contain;
    background-repeat: no-repeat;
    color: #fff;
}

.magic-text {
    font-size: 22px;
    font-family: 'Microsoft YaHei';
    color: #fff;
    -webkit-text-stroke: 2px #b72de1;
    text-stroke: 2px #b72de1;
    /* 过渡动画基础配置 */
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 动画激活状态 */
.magic-text.animate {
    /* 缩放效果 */
    transform: scale(1.3);
    /* 颜色变化（可选） */
    color: #ffef00;
    -webkit-text-stroke: 2px #ff6600;
}
</style>