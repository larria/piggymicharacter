<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

import PCard from '../components/PCard.vue'

const pCardLen = 28
</script>

<template>
    <section class="pcard-list">
        <div class="pcard-item-wrap" v-for="i in pCardLen" :key="i">
            <PCard :cId="(i - 1).toString()" unlockProgress="0"></PCard>
        </div>
    </section>
</template>

<style scoped>
.pcard-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}

.pcard-item-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 10vw;
}
</style>