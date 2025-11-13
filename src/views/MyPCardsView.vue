<script setup>
import PCardList from '../components/PCardList.vue'
import PageHeader from '../components/PageHeader.vue'
</script>

<template>
  <PageHeader>
    <template #center>
      <div class="study-head-center">
        <h2>画片藏馆</h2>
      </div>
    </template>
  </PageHeader>
  <div class="pcards-wrap">
    <PCardList />
  </div>
</template>

<style>
h2 {
  font-size: 30px;
}

.pcards-wrap {
  padding: 20px;
}
</style>
