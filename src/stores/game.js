import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import cData from '@/assets/data/data-full-all.json'

export const useGameStore = defineStore('game', () => {
  // ====================== 状态 (State) ======================
  // 魔力值
  const magicPoints = ref(360)
  
  // 用户学习状态 - 按localStorage格式存储
  const characterStates = ref([])
  
  // 已兑换画片ID列表
  const collectedCards = ref([])
  
  // 所有汉字数据 (此数据不进行持久化)
  const allCharactersData = ref(cData)

  // ====================== 常量 (Constants) ======================
  const DAILY_LEARN_LIMIT = 30
  const DAILY_MASTER_LIMIT = 30
  const REQUIRED_CORRECT_COUNT = 3
  const CARD_COST = 160

  // ====================== 计算属性 (Getters) ======================
  // 获取已掌握的字列表
  const masteredCharacters = computed(() => {
    return characterStates.value
      .filter(state => isCharacterMastered(state))
      .map(state => state.character)
  })

  // 获取已初识但未掌握的字列表
  const learnedCharacters = computed(() => {
    return characterStates.value
      .filter(state => isCharacterLearned(state) && !isCharacterMastered(state))
      .map(state => state.character)
  })

  // 获取未初识的字列表
  const unlearnedCharacters = computed(() => {
    const allChars = getAllCharacters()
    const learnedList = new Set([...masteredCharacters.value, ...learnedCharacters.value])
    return allChars.filter(char => !learnedList.has(char))
  })

  // ====================== 内部辅助函数 ======================
  // 判断字是否已掌握
  function isCharacterMastered(characterState) {
    if (!characterState?.stateList) return false
    const correctCount = characterState.stateList.filter(action =>
      action.action === '测验' && action.isCorrect
    ).length
    return correctCount >= REQUIRED_CORRECT_COUNT
  }

  // 判断字是否已初识
  function isCharacterLearned(characterState) {
    if (!characterState?.stateList) return false
    return characterState.stateList.some(action => action.action === '初识')
  }

  // 获取所有字的列表（从数据文件中提取）
  function getAllCharacters() {
    return allCharactersData.value.map(char => char.character)
  }

  // ====================== 核心业务方法 (Actions) ======================
  // 获取字的状态记录
  function getCharacterState(character) {
    return characterStates.value.find(state => state.character === character)
  }

  // 获取今日初识字数
  function getTodayLearnCount() {
    const today = new Date().toDateString()
    return characterStates.value.filter(state => {
      const learnAction = state.stateList?.find(action => action.action === '初识')
      return learnAction && new Date(learnAction.date).toDateString() === today
    }).length
  }

  // 获取今日掌握字数
  function getTodayMasterCount() {
    const today = new Date().toDateString();
    let count = 0;
    for (const state of characterStates.value) {
      const correctTests = state.stateList
        .filter(action => action.action === '测验' && action.isCorrect)
        .sort((a, b) => a.date - b.date);

      if (correctTests.length >= REQUIRED_CORRECT_COUNT) {
        const masteringTest = correctTests[REQUIRED_CORRECT_COUNT - 1];
        if (new Date(masteringTest.date).toDateString() === today) {
          count++;
        }
      }
    }
    return count;
  }
  
  // 处理初识操作
  function learnCharacter(character) {
    if (getTodayLearnCount() >= DAILY_LEARN_LIMIT) {
      return { success: false, message: '今日初识字数已达上限' }
    }
    
    let state = getCharacterState(character)
    
    if (!state) {
      state = { character, stateList: [] }
      characterStates.value.push(state)
    }
    
    if (isCharacterLearned(state)) {
      return { success: false, message: '已经初识过这个字' }
    }
    
    state.stateList.push({ action: '初识', date: Date.now() })
    magicPoints.value += 1
    
    // 无需手动保存，插件会自动处理
    return { success: true, message: '初识成功' }
  }
  
  // 处理测验操作
  function testCharacter(character, isCorrect) {
    let state = getCharacterState(character)
    
    if (!state || !isCharacterLearned(state)) {
      return { success: false, message: '请先初识这个字' }
    }
    
    const wasAlreadyMastered = isCharacterMastered(state);

    state.stateList.push({ action: '测验', isCorrect, date: Date.now() })
    
    const isNowMastered = isCharacterMastered(state);
    let message = ''
    let reward = 0
    
    if (isCorrect && !wasAlreadyMastered && isNowMastered) {
      if (getTodayMasterCount() <= DAILY_MASTER_LIMIT) {
        reward = 5
        magicPoints.value += reward
        message = '恭喜！已掌握此字'
      } else {
        message = '已掌握此字，但今日掌握名额已满，无魔力值奖励'
      }
    } else if (isCorrect) {
      if (isNowMastered) {
        message = '已掌握的字，测验正确！'
      } else {
        const correctCount = state.stateList.filter(a => a.action === '测验' && a.isCorrect).length
        message = `测验正确！还需要${REQUIRED_CORRECT_COUNT - correctCount}次正确`
      }
    } else {
      message = '测验错误，继续努力！'
    }
    
    // 无需手动保存，插件会自动处理
    return { success: true, message, reward, isMastered: isNowMastered }
  }

  // 兑换画片
  function exchangeCard(cardId) {
    if (magicPoints.value < CARD_COST) {
      return { success: false, message: '魔力值不足' }
    }
    if (collectedCards.value.includes(cardId)) {
      return { success: false, message: '画片已存在' }
    }
    
    magicPoints.value -= CARD_COST
    collectedCards.value.push(cardId)
    
    // 无需手动保存，插件会自动处理
    return { success: true, message: '兑换成功' }
  }

  // 检查画片是否已兑换
  function isCardCollected(cardId) {
    return collectedCards.value.includes(cardId)
  }

  // 设置所有汉字数据
  function setAllCharactersData(data) {
    allCharactersData.value = data || []
  }
  
  // 获取统计数据
  function getStats() {
    return {
      total: getAllCharacters().length,
      learned: learnedCharacters.value.length,
      mastered: masteredCharacters.value.length,
      todayLearn: getTodayLearnCount(),
      todayMaster: getTodayMasterCount()
    }
  }

  // 返回 store 的公共接口
  return {
    // State
    magicPoints,
    characterStates,
    collectedCards,
    allCharactersData,
    
    // Constants
    DAILY_LEARN_LIMIT,
    DAILY_MASTER_LIMIT,
    REQUIRED_CORRECT_COUNT,
    CARD_COST,
    
    // Getters
    masteredCharacters,
    learnedCharacters,
    unlearnedCharacters,
    
    // Actions
    getCharacterState,
    getTodayLearnCount,
    getTodayMasterCount,
    learnCharacter,
    testCharacter,
    exchangeCard,
    isCardCollected,
    setAllCharactersData,
    getStats,
  }
}, {
  // ====================== 持久化配置 ======================
  persist: {
    // 存储在 localStorage 中的 key
    key: 'piggy-mi-character-game',
    
    // 需要持久化的 state，没写的则不会被持久化
    paths: ['magicPoints', 'characterStates', 'collectedCards'],
  }
})