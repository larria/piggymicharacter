<script setup>
import cData from '@/assets/data/data-full-all.json'
import MiniCCardList from '../components/MiniCCardList.vue'
</script>

<template>
  <h2>CCardList</h2>
  <MiniCCardList :cInfo="cData[699]" />
</template>

<style>
h2 {
    font-size: 14px;
}
</style>
