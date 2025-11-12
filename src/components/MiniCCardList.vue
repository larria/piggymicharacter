<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

import cData from '@/assets/data/data-full-all.json'
// import CCard from '../components/CCard.vue'
</script>

<template>
    <section class="ccard-mini-list">
        <div class="ccard-mini-item-wrap" v-for="i in cData" :key="i">
            <!-- i.character为单个汉字，例如：“李”、“字”、“六”等 -->
            {{ i.character }}
        </div>
    </section>
</template>

<style scoped>
.ccard-mini-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}

.ccard-mini-item-wrap {
    display: flex;
    padding: 5px;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    background-color: #fff;
}
</style>