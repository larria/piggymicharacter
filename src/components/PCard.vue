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

// console.log(props.unlockProgress);

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
    position: relative;
    background: white;
    border-radius: 15px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    height: 140px;
}
.pcard:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.pcard-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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
