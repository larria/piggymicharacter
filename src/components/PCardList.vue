<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

import PCard from '../components/PCard.vue'

const pCardLen = 28
</script>

<template>
    <section class="pcard-list">
        <PCard :cId="(i - 1).toString()" unlockProgress="0" v-for="i in pCardLen" :key="i"></PCard>
    </section>
</template>

<style scoped>
.pcard-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
}
</style>