import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'

import cData from '@/assets/data/data-full-all.json'

export const useGameStore = defineStore('game', () => {
  // ====================== 状态 (State) ======================
  const magicPoints = ref(800)
  const characterStates = ref([])
  const collectedCards = ref([])
  // 使用 shallowRef，只有 .value 被替换时才触发更新，内部属性变化不追踪
  const allCharactersData = shallowRef(cData)

  // ====================== 常量 (Constants) ======================
  const DAILY_LEARN_LIMIT = 30
  const DAILY_MASTER_LIMIT = 30
  const REQUIRED_CORRECT_COUNT = 3
  const CARD_COST = 160
  // 【新增】复习门槛：至少学会10个字
  const MIN_REVIEW_COUNT = 10

  // ====================== 计算属性 (Getters) ======================
  const masteredCharacters = computed(() => {
    return characterStates.value
      .filter(state => isCharacterMastered(state))
      .map(state => state.character)
  })

  const learnedCharacters = computed(() => {
    return characterStates.value
      .filter(state => isCharacterLearned(state) && !isCharacterMastered(state))
      .map(state => state.character)
  })

  const unlearnedCharacters = computed(() => {
    const allChars = getAllCharacters()
    const learnedList = new Set([...masteredCharacters.value, ...learnedCharacters.value])
    return allChars.filter(char => !learnedList.has(char))
  })

  // ====================== 内部辅助函数 ======================
  function isCharacterMastered(characterState) {
    if (!characterState?.stateList) return false
    const correctCount = characterState.stateList.filter(action =>
      action.action === '测验' && action.isCorrect
    ).length
    return correctCount >= REQUIRED_CORRECT_COUNT
  }

  function isCharacterLearned(characterState) {
    if (!characterState?.stateList) return false
    return characterState.stateList.some(action => action.action === '初识')
  }

  function getAllCharacters() {
    return allCharactersData.value.map(char => char.character)
  }

  // ====================== 核心业务方法 (Actions) ======================
  function getCharacterState(character) {
    return characterStates.value.find(state => state.character === character)
  }

  // 获取指定汉字的当前正确次数 +++
  function getCharacterCorrectCount(character) {
    const state = getCharacterState(character);
    if (!state?.stateList) return 0;
    return state.stateList.filter(action => action.action === '测验' && action.isCorrect).length;
  }

  function getTodayLearnCount() {
    const today = new Date().toDateString()
    return characterStates.value.filter(state => {
      const learnAction = state.stateList?.find(action => action.action === '初识')
      return learnAction && new Date(learnAction.date).toDateString() === today
    }).length
  }

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

  // 【新增】获取今日所有答对的次数（用于UI展示，提供即时反馈）
  function getTodayCorrectCount() {
    const today = new Date().toDateString();
    let count = 0;
    for (const state of characterStates.value) {
      if (state.stateList) {
        // 统计所有 action 为 '测验' 且 isCorrect 为 true 且日期是今天的记录
        count += state.stateList.filter(action =>
          action.action === '测验' &&
          action.isCorrect &&
          new Date(action.date).toDateString() === today
        ).length;
      }
    }
    return count;
  }

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
    magicPoints.value += 3
    return { success: true, message: '初识成功' }
  }

  // +++ 修改方法：使其返回 newCorrectCount +++
  function recordExamResult(character, isCorrect) {
    let state = getCharacterState(character)
    if (!state || !isCharacterLearned(state)) {
      return { success: false, message: '请先初识这个字' }
    }

    const wasAlreadyMastered = isCharacterMastered(state);
    state.stateList.push({ action: '测验', isCorrect, date: Date.now() })

    const newCorrectCount = getCharacterCorrectCount(character); // 获取最新的正确次数
    const isNowMastered = isCharacterMastered(state);
    let message = ''
    let reward = 0

    if (isCorrect && !wasAlreadyMastered && isNowMastered) {
      if (getTodayMasterCount() <= DAILY_MASTER_LIMIT) {
        reward = 3
        magicPoints.value += reward
        message = '恭喜！已掌握此字'
      } else {
        message = '已掌握此字，但今日掌握名额已满，无魔力值奖励'
      }
    } else if (isCorrect) {
      if (isNowMastered) {
        message = '已掌握的字，测验正确！'
      } else {
        message = `测验正确！还需要${REQUIRED_CORRECT_COUNT - newCorrectCount}次正确`
      }
    } else {
      message = '测验错误，继续努力！'
    }

    return { success: true, message, reward, isMastered: isNowMastered, newCorrectCount };
  }

  function exchangeCard(cardId) {
    if (magicPoints.value < CARD_COST) {
      return { success: false, message: '魔力值不足' }
    }
    if (collectedCards.value.includes(cardId)) {
      return { success: false, message: '画片已存在' }
    }
    magicPoints.value -= CARD_COST
    collectedCards.value.push(cardId)
    return { success: true, message: '兑换成功' }
  }

  function isCardCollected(cardId) {
    return collectedCards.value.includes(cardId)
  }

  function setAllCharactersData(data) {
    allCharactersData.value = data || []
  }

  function getStats() {
    return {
      total: getAllCharacters().length,
      learned: learnedCharacters.value.length,
      mastered: masteredCharacters.value.length,
      todayLearn: getTodayLearnCount(),
      todayMaster: getTodayMasterCount()
    }
  }

  /**
   * 生成备份数据对象
   */
  function generateBackupData() {
    return {
      version: '1.0', // 版本号，方便未来做迁移
      timestamp: Date.now(),
      data: {
        magicPoints: magicPoints.value,
        characterStates: characterStates.value,
        collectedCards: collectedCards.value
      }
    }
  }

  /**
   * 恢复存档数据
   * @param {Object} backupData 解析后的JSON对象
   * @returns {Object} { success: boolean, message: string }
   */
  function restoreBackupData(backupData) {
    try {
      // 1. 基础结构校验
      if (!backupData || !backupData.data) {
        return { success: false, message: '无效的存档文件格式' }
      }

      const { data } = backupData

      // 2. 字段校验 (简单校验关键字段是否存在)
      if (typeof data.magicPoints !== 'number' || !Array.isArray(data.characterStates) || !Array.isArray(data.collectedCards)) {
        return { success: false, message: '存档数据缺失或损坏' }
      }

      // 3. 应用数据
      magicPoints.value = data.magicPoints
      characterStates.value = data.characterStates
      collectedCards.value = data.collectedCards

      return { success: true, message: '存档导入成功！' }
    } catch (e) {
      console.error(e)
      return { success: false, message: '导入过程中发生错误' }
    }
  }

  return {
    magicPoints,
    characterStates,
    collectedCards,
    allCharactersData,
    DAILY_LEARN_LIMIT,
    DAILY_MASTER_LIMIT,
    REQUIRED_CORRECT_COUNT,
    CARD_COST,
    MIN_REVIEW_COUNT,
    masteredCharacters,
    learnedCharacters,
    unlearnedCharacters,
    getCharacterState,
    getTodayLearnCount,
    getTodayMasterCount,
    getTodayCorrectCount,
    learnCharacter,
    recordExamResult,
    exchangeCard,
    isCardCollected,
    setAllCharactersData,
    getStats,
    getCharacterCorrectCount,
    generateBackupData,
    restoreBackupData
  }
}, {
  persist: {
    key: 'piggy-mi-character-game-gemini3',
    paths: ['magicPoints', 'characterStates', 'collectedCards'],
  }
})