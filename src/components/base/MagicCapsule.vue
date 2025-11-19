<script setup>
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
// 修改引入：增加 Ph 前缀
import { PhSparkle } from '@phosphor-icons/vue';

const gameStore = useGameStore();
const { magicPoints } = storeToRefs(gameStore);
</script>

<template>
  <div class="flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-1 border-2 border-candy-yellow shadow-lg text-white">
    <!-- 修改标签使用：增加 Ph 前缀 -->
    <PhSparkle weight="fill" class="text-candy-yellow w-6 h-6 mr-2 animate-pulse" />
    <span class="font-bold text-xl font-mono">{{ magicPoints }}</span>
  </div>
</template>