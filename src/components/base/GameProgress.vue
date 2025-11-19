<script setup>
defineProps({
  value: { type: Number, default: 0 }, // 当前值
  max: { type: Number, default: 100 }, // 最大值
  color: { type: String, default: 'bg-candy-green' } // 进度条颜色类名
});
</script>

<template>
  <div class="w-full h-6 bg-gray-200 rounded-full border-2 border-white shadow-inner overflow-hidden relative">
    <!-- 进度填充 -->
    <div 
      class="h-full transition-all duration-500 ease-out relative"
      :class="color"
      :style="{ width: `${Math.min((value / max) * 100, 100)}%` }"
    >
      <!-- 光泽动画 -->
      <div class="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] skew-x-12 origin-left scale-x-150"></div>
    </div>
    <!-- 文字 -->
    <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-dark-text/70 drop-shadow-sm">
      {{ value }} / {{ max }}
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(150%) skewX(-20deg); }
}
</style>