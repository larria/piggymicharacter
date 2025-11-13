<script setup>
import { nextTick, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'

import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()
</script>

<template>
    <section class="magicpoint-wrap">
        <span class="magic-icon"></span>
        <span class="magic-text">{{ gameStore.magicPoints }}</span>
    </section>
</template>

<style scoped>
.magicpoint-wrap{
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
} 
.magic-icon {
    width: 30px;
    height: 30px;
    background-image: url(../assets/images/style/icon_power.png);
    background-size: contain;
    background-repeat: no-repeat;
    color: #fff;
}

.magic-text {
    font-size: 22px;
    font-family: 'Microsoft YaHei';
    color: #fff;
    -webkit-text-stroke: 2px #b72de1; /* 为Webkit内核浏览器设置红色边框 */
    text-stroke: 2px #b72de1; /* 标准属性，但目前大多数浏览器还不支持，所以主要靠前缀 */
}
</style>