<script setup>
import PCardList from '../components/PCardList.vue'
import PageHeader from '../components/PageHeader.vue'

const resetLocal = () => {
  if (confirm('是否重置游戏数据？')) {
    localStorage.removeItem('piggy-mi-character-game')
    window.location.reload()
  }
}
</script>

<template>
  <PageHeader>
    <template #center>
      <div class="study-head-center">
        <h2 @click="resetLocal">画片藏馆</h2>
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
