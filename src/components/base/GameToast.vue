<script setup>
import { computed } from 'vue';
import { toastState } from '@/utils/gameToast';
import { PhInfo, PhCheckCircle, PhWarningCircle, PhSmileySad } from '@phosphor-icons/vue';

// 根据类型定义样式配置
const styleConfig = computed(() => {
  switch (toastState.type) {
    case 'success':
      return {
        bg: 'bg-candy-green',
        border: 'border-emerald-200',
        icon: PhCheckCircle
      };
    case 'warning':
      return {
        bg: 'bg-candy-orange',
        border: 'border-yellow-200',
        icon: PhWarningCircle
      };
    case 'error':
      return {
        bg: 'bg-candy-red',
        border: 'border-red-200',
        icon: PhSmileySad
      };
    default: // info
      return {
        bg: 'bg-candy-blue',
        border: 'border-blue-200',
        icon: PhInfo
      };
  }
});
</script>

<template>
  <Transition name="toast-pop">
    <div 
      v-if="toastState.show" 
      class="fixed top-[15%] left-1/2 -translate-x-1/2 z-[10000] pointer-events-none w-full max-w-sm px-4 flex justify-center"
    >
      <div 
        class="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-4 backdrop-blur-sm transition-colors duration-300"
        :class="[styleConfig.bg, styleConfig.border]"
      >
        <!-- 图标 -->
        <component 
          :is="styleConfig.icon" 
          weight="fill" 
          class="text-white w-8 h-8 flex-shrink-0 animate-bounce-sm" 
        />

        <!-- 文字内容 (支持换行) -->
        <span class="text-white font-bold text-lg font-cartoon tracking-wide leading-tight whitespace-pre-line drop-shadow-md">
          {{ toastState.message }}
        </span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 类似果冻弹出的动画 */
.toast-pop-enter-active {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-pop-leave-active {
  transition: all 0.3s ease-in;
}
.toast-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.8);
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50px) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}
</style>