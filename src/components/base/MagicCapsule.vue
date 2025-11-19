<script setup>
import { ref, watch } from 'vue'; // 引入 ref, watch
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { PhSparkle } from '@phosphor-icons/vue';

const gameStore = useGameStore();
const { magicPoints } = storeToRefs(gameStore);

// 【新增】动画状态
const isAnimating = ref(false);
const addedValue = ref(0);

// 【新增】监听魔力值变化
watch(magicPoints, (newVal, oldVal) => {
  if (newVal > oldVal) {
    // 记录增加的值（可选用于显示 +3）
    addedValue.value = newVal - oldVal;
    
    // 触发动画
    isAnimating.value = true;
    setTimeout(() => {
      isAnimating.value = false;
    }, 600); // 动画持续时间
  }
});
</script>

<template>
  <div 
    class="flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-1 border-2 shadow-lg text-white transition-all duration-300 relative"
    :class="isAnimating ? 'scale-110 border-white bg-candy-orange/80' : 'border-candy-yellow'"
  >
    <!-- 漂浮的 +N 数字 (动画时显示) -->
    <Transition name="float-up">
      <span v-if="isAnimating" class="absolute -top-6 right-0 text-candy-yellow font-bold text-xl font-cartoon drop-shadow-md">
        +{{ addedValue }}
      </span>
    </Transition>

    <PhSparkle 
      weight="fill" 
      class="text-candy-yellow w-6 h-6 mr-2 transition-transform duration-500" 
      :class="isAnimating ? 'rotate-180 scale-125' : 'animate-pulse'"
    />
    
    <span class="font-bold text-xl font-mono tabular-nums">{{ magicPoints }}</span>
  </div>
</template>

<style scoped>
/* 简单的上浮消失动画 */
.float-up-enter-active {
  animation: float-up 0.8s ease-out forwards;
}
.float-up-leave-active {
  display: none;
}

@keyframes float-up {
  0% { opacity: 0; transform: translateY(5px) scale(0.5); }
  20% { opacity: 1; transform: translateY(0) scale(1.2); }
  100% { opacity: 0; transform: translateY(-20px) scale(1); }
}
</style>