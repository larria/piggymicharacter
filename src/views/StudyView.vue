<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'

import CCard from '../components/CCard.vue'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// console.log(gameStore.unlearnedCharacters)
// 随机从未学的字中随机30个，组成这次的汉字学习列表
const charactersToLearn = gameStore.unlearnedCharacters.slice().sort(() => 0.5 - Math.random()).slice(0, 30)
// console.log(charactersToLearn);
console.log(getCharacterInfoFromCharacter('奶'));



const isCurrentCharacterFinished = ref(false)

const handleFinished = () => {
  // 在这里处理卡片学习完成后的逻辑
  console.log('卡片学习完成')
  isCurrentCharacterFinished.value = true
}

const showNextCharacter = () => {
  // 在这里处理显示下一个汉字的逻辑
  console.log('显示下一个汉字')
  isCurrentCharacterFinished.value = false
}

// 根据汉字获取汉字信息
function getCharacterInfoFromCharacter (character) {
  const characterInfo = gameStore.allCharactersData.find((info) => info.character === character)
  return characterInfo
}
</script>

<template>
  <h2>Study</h2>
  <CCard :cInfo="gameStore.allCharactersData[699]" @finished="handleFinished" />
  <button class="next-character" v-if="isCurrentCharacterFinished" @click="showNextCharacter">我学会了！</button>
</template>

<style>
h2 {
  font-size: 14px;
}
</style>
