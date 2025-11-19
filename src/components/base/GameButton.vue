<script setup>
import { computed } from 'vue';
import { audioManager } from '@/utils/audio';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, secondary, success, danger, warning
    validator: (val) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(val)
  },
  disabled: Boolean,
  block: Boolean, // 是否占满宽度
  size: {
    type: String,
    default: 'md', // sm, md, lg
  }
});

const emit = defineEmits(['click']);

// 颜色映射：背景色 + 阴影色（深一点）
const colorMap = {
  primary: 'bg-candy-blue border-b-blue-700 active:border-b-0',
  success: 'bg-candy-green border-b-emerald-700 active:border-b-0',
  danger: 'bg-candy-red border-b-red-700 active:border-b-0',
  warning: 'bg-candy-yellow border-b-amber-600 active:border-b-0',
  info: 'bg-candy-purple border-b-purple-800 active:border-b-0',
  secondary: 'bg-gray-400 border-b-gray-600 active:border-b-0',
};

const sizeClass = computed(() => {
  switch(props.size) {
    case 'sm': return 'px-4 py-2 text-lg rounded-xl border-b-[4px]';
    case 'lg': return 'px-8 py-4 text-3xl rounded-3xl border-b-[8px]';
    default: return 'px-6 py-3 text-2xl rounded-2xl border-b-[6px]';
  }
});

const handleClick = (e) => {
  if (props.disabled) return;
  audioManager.play('click');
  emit('click', e);
};
</script>

<template>
  <button
    @click="handleClick"
    :disabled="disabled"
    class="relative font-bold text-white transition-all transform active:translate-y-[4px] active:border-b-0 focus:outline-none select-none"
    :class="[
      colorMap[variant],
      sizeClass,
      block ? 'w-full flex justify-center items-center' : 'inline-flex items-center justify-center gap-2',
      disabled ? 'opacity-50 grayscale cursor-not-allowed active:translate-y-0 active:border-b-[6px]' : 'hover:brightness-110'
    ]"
  >
    <slot></slot>
  </button>
</template>