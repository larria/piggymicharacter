<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
    cId: {
        type: Number,
        required: true,
    },
    // 解锁进度，0-1
    unlockProgress: {
        type: Number,
        default: 0,
    }
});
const blurCSS = computed(() => {
    // 如果解锁进度为1，完全清除模糊
    if (props.unlockProgress === 1) {
        return 'filter: blur(0px)';
    }

    // 计算基础模糊值：根据解锁进度从30递减
    // 当unlockProgress为0时，blur为30
    // 当unlockProgress增加时，blur从30开始递减
    const baseBlur = 20 * (1 - props.unlockProgress);

    // 确保如果解锁进度不为1，至少有5px的模糊
    const finalBlur = parseInt(props.unlockProgress, 10) === 1 ? 0 : Math.max(baseBlur, 5);

    return `filter: blur(${finalBlur}px)`;
});

const imgURL = computed(() => {
    return new URL(`../assets/images/cards/c${props.cId}.jpg`, import.meta.url).href;
});
</script>

<template>
    <div class="pcard">
        <img class="pcard-img" :src="imgURL" alt="" :style="blurCSS">
    </div>
</template>

<style scoped>
/* 卡片容器 */
.pcard {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    border-radius: 16px;
    /* 使用更圆润的边角，显得更现代 */
    overflow: hidden;
    /* 关键：确保图片圆角被裁剪 */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    /* 柔和的阴影，增加层次感 */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 平滑的过渡动画 */
    cursor: pointer;
    /* 提示用户可交互 */
}
.pcard-img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
    /* 关键：保证图片不变形且填满容器 */
    transition: all 1s ease-in-out;
    /* 图片独立的、稍慢的缩放动画 */
}

/* 鼠标悬停效果 */
.pcard:hover {
    transform: translateY(-10px) scale(1.02);
    /* 轻微上浮并放大 */
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    /* 加深阴影，强化“浮起”效果 */
}

/* 鼠标悬停时，图片进一步放大 */
.pcard:hover .pcard-img {
    transform: scale(1.03);
    /* 图片放大，创造视差感 */
}
</style>
