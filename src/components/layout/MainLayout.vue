<script setup>
import { onMounted, computed } from 'vue';
import { audioManager } from '@/utils/audio';

const props = defineProps({
    bgImage: {
        type: String,
        default: 'bg_common.jpg'
    },
    title: String,
});

// 【修正】使用 new URL 动态解析图片路径
// 注意：MainLayout.vue 在 src/components/layout/ 目录下
// 图片在 src/assets/images/ 目录下
// 所以相对路径是 ../../assets/images/
const bgStyle = computed(() => {
    try {
        // Vite 会在构建时处理这个 URL
        const imgUrl = new URL(`../../assets/images/${props.bgImage}`, import.meta.url).href;
        return { backgroundImage: `url(${imgUrl})` };
    } catch (e) {
        console.error('背景图加载失败', e);
        return {};
    }
});

// 尝试初始化音频环境
const handleInteraction = () => {
    audioManager.initAudioContext();
};
</script>

<template>
    <div class="w-full h-full bg-cover bg-center bg-no-repeat relative overflow-hidden flex flex-col" :style="bgStyle" @click.once="handleInteraction" @touchstart.once="handleInteraction">
        <!-- 遮罩层，让文字更清晰 -->
        <div class="absolute inset-0 bg-white/10 pointer-events-none backdrop-blur-[1px]"></div>

        <!-- 顶部栏 -->
        <header v-if="$slots.header || title" class="relative z-10 p-4 pt-8 flex justify-between items-center">
            <div v-if="title" class="text-3xl font-cartoon text-white drop-shadow-md text-stroke-sm">
                {{ title }}
            </div>
            <slot name="header"></slot>
        </header>

        <!-- 主要内容区 -->
        <main class="relative z-10 flex-1 flex flex-col overflow-hidden p-4 safe-area-bottom">
            <slot></slot>
        </main>

        <!-- 悬浮元素层 -->
        <div class="absolute inset-0 pointer-events-none z-20">
            <slot name="overlay"></slot>
        </div>
    </div>
</template>

<style scoped>
.text-stroke-sm {
    -webkit-text-stroke: 2px #2C3A47;
    paint-order: stroke fill;
}
.safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>