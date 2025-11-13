<script setup>
import { nextTick, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'

import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// const props = defineProps({
//   title: {
//     type: String,
//     required: true,
//   },
// });

const toHome = () => {
  router.push('/')
};
</script>

<template>
    <header>
      <!-- 左侧插槽 -->
      <div class="left-slot">
        <slot name="left">
          <!-- 默认内容 -->
          <i @click="toHome">🏠</i>
        </slot>
      </div>
      
      <!-- 中间插槽 -->
      <div class="center-slot">
        <slot name="center">
          <!-- 默认内容 -->
        </slot>
      </div>
      
      <!-- 右侧插槽 -->
      <div class="right-slot">
        <slot name="right">
          <!-- 默认内容 -->
          <MagicPoint />
        </slot>
      </div>
    </header>
</template>

<style scoped>
header {
  display: flex;
  position: relative;
  padding: 10px 20px;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
}

header i {
  display: block;
  font-style: normal;
  font-size: 40px;
}

.left-slot,
.center-slot,
.right-slot {
  display: flex;
  align-items: center;
}

.center-slot {
  flex: 1;
  justify-content: center;
  text-align: center;
}

.left-slot {
  justify-content: flex-start;
}

.right-slot {
  justify-content: flex-end;
}
</style>