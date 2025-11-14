<template>
    <div class="ring-progress-container" :style="{ width: size + 'px', height: size + 'px' }">
        <svg class="ring-progress" :width="size" :height="size">
            <!-- 背景圆环 -->
            <circle class="ring-background" :cx="center" :cy="center" :r="radius" :stroke-width="strokeWidth" fill="none" :stroke="backgroundColor" />

            <!-- 进度圆环 -->
            <circle class="ring-progress-bar" :cx="center" :cy="center" :r="radius" :stroke-width="strokeWidth" fill="none" :stroke="gradient ? 'url(#gradient)' : color" :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" :stroke-linecap="strokeLinecap" :style="transitionStyle" />

            <!-- 渐变定义 -->
            <defs v-if="gradient">
                <linearGradient id="gradient" :x1="gradientStart.x" :y1="gradientStart.y" :x2="gradientEnd.x" :y2="gradientEnd.y">
                    <stop offset="0%" :stop-color="gradientStart.color" />
                    <stop offset="100%" :stop-color="gradientEnd.color" />
                </linearGradient>
            </defs>
        </svg>

        <!-- 中间内容 -->
        <div class="ring-content">
            <slot>
                <div class="default-content">
                    <div class="percentage-text">{{ displayText }}</div>
                    <div v-if="showLabel" class="label-text">{{ label }}</div>
                </div>
            </slot>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'

// 定义props
const props = defineProps({
    // 进度值 (0-100)
    progress: {
        type: Number,
        required: true
    },
    // 组件大小
    size: {
        type: Number,
        default: 120
    },
    // 环形宽度
    strokeWidth: {
        type: Number,
        default: 8
    },
    // 进度条颜色
    color: {
        type: String,
        default: '#b72de1'
    },
    // 背景颜色
    backgroundColor: {
        type: String,
        default: '#E5E7EB'
    },
    // 是否启用渐变
    gradient: {
        type: Boolean,
        default: false
    },
    // 渐变起始颜色
    gradientStartColor: {
        type: String,
        default: '#667EEA'
    },
    // 渐变结束颜色
    gradientEndColor: {
        type: String,
        default: '#764BA2'
    },
    // 线条端点样式
    strokeLinecap: {
        type: String,
        default: 'round',
        validator: (value) => ['butt', 'round', 'square'].includes(value)
    },
    // 自定义显示文本
    text: {
        type: String,
        default: ''
    },
    // 标签文字
    label: {
        type: String,
        default: ''
    },
    // 是否显示标签
    showLabel: {
        type: Boolean,
        default: false
    },
    // 动画持续时间（毫秒）
    animationDuration: {
        type: Number,
        default: 1000
    },
    // 是否显示动画
    animated: {
        type: Boolean,
        default: true
    }
});

// 计算中心点和半径
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)

// 计算圆周长
const circumference = computed(() => 2 * Math.PI * radius.value)

// 当前进度
const currentProgress = ref(0)

// 计算偏移量
const dashOffset = computed(() => {
    const offset = circumference.value - (currentProgress.value / 100) * circumference.value
    return offset
})

// 显示文本
const displayText = computed(() => {
    if (props.text) {
        return props.text
    }
    return `${currentProgress.value.toFixed(1)}%`
})

// 渐变配置
const gradientStart = computed(() => ({
    x: '0%',
    y: '0%',
    color: props.gradientStartColor
}))

const gradientEnd = computed(() => ({
    x: '100%',
    y: '100%',
    color: props.gradientEndColor
}))

// 过渡样式
const transitionStyle = computed(() => {
    if (props.animated) {
        return {
            transition: `stroke-dashoffset ${props.animationDuration}ms ease-in-out`
        }
    }
    return {}
})

// 监听进度变化
watch(() => props.progress, (newVal) => {
    if (props.animated) {
        // 动画过渡
        const startValue = currentProgress.value
        const endValue = Math.min(100, Math.max(0, newVal))
        const duration = props.animationDuration
        const startTime = Date.now()

        const animate = () => {
            const currentTime = Date.now()
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // 使用缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            currentProgress.value = startValue + (endValue - startValue) * easeProgress

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    } else {
        currentProgress.value = Math.min(100, Math.max(0, newVal))
    }
}, { immediate: true })

onMounted(() => {
    // 初始化进度
    currentProgress.value = Math.min(100, Math.max(0, props.progress))
})
</script>

<style scoped>
.ring-progress-container {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-90deg);
}

.ring-progress {
    position: absolute;
    top: 0;
    left: 0;
}

.ring-background {
    opacity: 0.3;
}

.ring-progress-bar {
    transform-origin: center;
    filter: drop-shadow(0 0 3px rgba(79, 70, 229, 0.3));
    transition: filter 0.3s ease;
}

.ring-progress-container:hover .ring-progress-bar {
    filter: drop-shadow(0 0 6px rgba(79, 70, 229, 0.5));
}

.ring-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
}

.default-content {
    text-align: center;
}

.percentage-text {
    font-size: calc(var(--size, 120) * 0.2);
    font-weight: 600;
    color: #1F2937;
    line-height: 1;
}

.label-text {
    font-size: calc(var(--size, 120) * 0.12);
    color: #6B7280;
    margin-top: 4px;
    font-weight: 400;
}
</style>