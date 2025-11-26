<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { tts } from '@/utils/tts';
import { PhArrowLeft, PhSword, PhShieldCheck, PhStar, PhTrophy, PhTrendUp } from '@phosphor-icons/vue';
import confetti from 'canvas-confetti';

import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import GameProgress from '@/components/base/GameProgress.vue';
import GameModal from '@/components/base/GameModal.vue';
import CharLearningCard from '@/components/business/CharLearningCard.vue';
import MagicCapsule from '@/components/base/MagicCapsule.vue';

const router = useRouter();
const gameStore = useGameStore();

// 状态
const gameState = ref('loading'); 
const currentQuestion = ref(null);
const selectedOption = ref(null);
const isAnswered = ref(false);
const isCorrect = ref(false);
const sessionCorrectCount = ref(0);
const sessionTotalCount = ref(0);

// 【新增】记录每个汉字上一次使用的句子，防止连续重复
// 格式: { '汉字': '上一次使用的完整句子内容' }
const lastUsedSentenceMap = ref({});

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 复习弹窗
const showReview = ref(false);
const isReviewFinished = ref(false);

// 每日掌握上限限制
const canEarnPoints = computed(() => gameStore.getTodayMasterCount() < gameStore.DAILY_MASTER_LIMIT);

// 进度条状态
const dailyLimit = computed(() => {
  const todayDone = gameStore.getTodayMasterCount();
  const remainingCandidates = gameStore.learnedCharacters.length; 
  const potentialTotal = todayDone + remainingCandidates;
  return Math.min(gameStore.DAILY_MASTER_LIMIT, potentialTotal);
});
const progressValue = computed(() => gameStore.getTodayMasterCount());

// 答题反馈状态
const feedback = ref({
    show: false,
    isMastered: false,
    count: 0,
    total: 3, 
    reward: 0
});

// --- 核心逻辑 ---
const initExam = () => {
    // 双重保险：虽然有路由守卫，但初始化时再检查一次更安全
    if (gameStore.learnedCharacters.length < gameStore.MIN_REVIEW_COUNT) {
        router.replace('/');
        return;
    }
    gameState.value = 'playing';
    nextQuestion();
};

const nextQuestion = () => {
    feedback.value.show = false;
    selectedOption.value = null;
    isAnswered.value = false;
    showReview.value = false;

    const learnedChars = gameStore.learnedCharacters;
    if (learnedChars.length === 0) {
        // 播放庆祝音效（可选）
        audioManager.play('celebrate');
        // 提示用户
        showToast('太棒了！所有待复习的汉字都已掌握！', 'success');
        // 跳转回首页
        router.replace('/');
        return;
    }

    // 随机选择一个汉字
    const targetChar = learnedChars[Math.floor(Math.random() * learnedChars.length)];
    const targetInfo = gameStore.allCharactersData.find(c => c.character === targetChar);

    // 【修改】句子选择逻辑：避免连续重复
    const sentences = targetInfo.example_sentences;
    let availableSentences = sentences;
    
    // 如果该汉字有上一次的使用记录，且总句子数大于1，则过滤掉上次用过的
    if (lastUsedSentenceMap.value[targetChar] && sentences.length > 1) {
        availableSentences = sentences.filter(s => s !== lastUsedSentenceMap.value[targetChar]);
        // 万一过滤后为空（理论上不会，因为判断了 length > 1），兜底使用原数组
        if (availableSentences.length === 0) {
            availableSentences = sentences;
        }
    }

    // 从可用列表中随机选一句
    const sentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
    
    // 更新记录
    lastUsedSentenceMap.value[targetChar] = sentence;

    const PLACEHOLDER = '（ __ ）';
    const questionText = sentence.replace(new RegExp(targetChar, 'g'), PLACEHOLDER);

    // 生成干扰项
    const options = new Set([targetChar]);
    const allChars = gameStore.allCharactersData;
    while (options.size < 4) {
        const randomChar = allChars[Math.floor(Math.random() * allChars.length)].character;
        options.add(randomChar);
    }

    currentQuestion.value = {
        targetChar,
        targetInfo,
        text: questionText,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };

    setTimeout(() => speakQuestion(), 500);
};

const speakQuestion = async () => {
    if (!currentQuestion.value) return;
    tts.stop();
    const { text, placeholder } = currentQuestion.value;
    const parts = text.split(placeholder);

    for (let i = 0; i < parts.length; i++) {
        if (isAnswered.value || !currentQuestion.value) break;
        if (parts[i]) {
            await tts.speak(parts[i]);
        }
        if (i < parts.length - 1) {
            if (isAnswered.value) break; 
            await wait(300); 
            if (isAnswered.value) break;
            await tts.speak('请咪猪头选择', { rate: 1.1 }); 
            if (isAnswered.value) break;
            await wait(300); 
        }
    }
};

const handleOptionClick = (option) => {
    if (isAnswered.value) return;
    tts.stop();

    isAnswered.value = true;
    selectedOption.value = option;
    sessionTotalCount.value++;

    const isRight = option === currentQuestion.value.targetChar;
    isCorrect.value = isRight;

    if (isRight) {
        audioManager.play('correct');
        sessionCorrectCount.value++;
        const res = gameStore.recordExamResult(currentQuestion.value.targetChar, true);

        // 【修改】反馈数据中增加 char 字段
        feedback.value = {
            show: true,
            isMastered: res.isMastered,
            count: res.newCorrectCount,
            total: gameStore.REQUIRED_CORRECT_COUNT, 
            reward: res.reward,
            char: currentQuestion.value.targetChar // 新增：记录当前汉字
        };

        if (res.isMastered) {
            audioManager.play('celebrate');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        setTimeout(nextQuestion, 2000);
    } else {
        audioManager.play('wrong');
        gameStore.recordExamResult(currentQuestion.value.targetChar, false);
        setTimeout(() => {
            isReviewFinished.value = false;
            showReview.value = true;
        }, 1000);
    }
};

const onReviewCardReadDone = () => {
    isReviewFinished.value = true;
};

const closeReviewAndNext = () => {
    showReview.value = false;
    nextQuestion();
};

onMounted(() => {
    initExam();
});

onUnmounted(() => {
    tts.stop();
});
</script>

<template>
    <MainLayout bgImage="bg_common.jpg">
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <button @click="router.push('/')" class="p-2 bg-white/50 rounded-full hover:bg-white transition">
                    <PhArrowLeft size="24" />
                </button>

                <!-- Boss 血条 -->
                <div class="flex-1 flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl shadow-sm">
                    <span class="text-2xl">👾</span>
                    <div class="flex-1">
                        <GameProgress :value="progressValue" :max="dailyLimit" color="bg-candy-red" />
                    </div>
                </div>

                <MagicCapsule />
            </div>
        </template>

        <div v-if="currentQuestion" class="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-4">

            <!-- 题目区域 -->
            <div class="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-xl w-full mb-8 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-candy-blue/10 rounded-full"></div>
                <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-candy-orange/10 rounded-full"></div>

                <h2 class="text-3xl md:text-4xl font-bold text-dark-text leading-relaxed text-center">
                    {{ currentQuestion.text }}
                </h2>
            </div>

            <!-- 选项区域 -->
            <div class="grid grid-cols-2 gap-6 w-full">
                <button v-for="opt in currentQuestion.options" :key="opt" @click="handleOptionClick(opt)" :disabled="isAnswered" class="h-24 text-4xl font-bold rounded-2xl shadow-md transition-all transform hover:scale-105 active:scale-95 border-b-4 flex items-center justify-center relative overflow-hidden" :class="[
                    isAnswered && opt === currentQuestion.targetChar ? 'bg-candy-green border-emerald-700 text-white' : '',
                    isAnswered && opt === selectedOption && opt !== currentQuestion.targetChar ? 'bg-candy-red border-red-700 text-white' : '',
                    !isAnswered ? 'bg-white border-gray-300 text-dark-text hover:bg-blue-50' : '',
                    isAnswered && opt !== currentQuestion.targetChar && opt !== selectedOption ? 'opacity-40 bg-gray-200' : ''
                ]">
                    {{ opt }}
                    <div v-if="isAnswered && opt === currentQuestion.targetChar" class="absolute right-2 bottom-2 animate-bounce">
                        <PhShieldCheck size="24" weight="fill" />
                    </div>
                </button>
            </div>

        </div>

        <!-- 复习弹窗 -->
        <GameModal :show="showReview" title="巩固一下" :closeable="false">
            <div class="flex flex-col items-center min-h-[400px]">
                <p class="text-gray-500 mb-4">哎呀答错了，再复习一遍吧！</p>
                <CharLearningCard v-if="currentQuestion" :info="currentQuestion.targetInfo" :autoPlay="true" @finish="onReviewCardReadDone" />
                <div class="mt-6 w-full transition-opacity duration-500" :class="isReviewFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'">
                    <GameButton variant="primary" :block="true" @click="closeReviewAndNext">
                        记住了，下一题
                    </GameButton>
                </div>
            </div>
        </GameModal>

        <!-- 答对反馈弹层 (底部弹出版) -->
        <Transition name="slide-up">
            <div v-if="feedback.show" class="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                <!-- 遮罩层 (可选，这里设为全透明以便保留游戏背景感，如果想要更聚焦可以加 bg-black/10) -->
                <div class="absolute inset-0 bg-transparent"></div>
                
                <!-- 底部面板 -->
                <div class="relative bg-white w-full rounded-t-[2.5rem] p-6 pb-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] border-t-4 border-candy-yellow flex flex-col items-center gap-3 transform transition-transform">
                    
                    <!-- 装饰性光效背景 -->
                    <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-full h-20 bg-gradient-to-t from-white to-transparent opacity-80 pointer-events-none"></div>

                    <!-- 顶部图标 (浮出面板一点点) -->
                    <div class="absolute -top-10 bg-white rounded-full p-2 border-4 border-candy-yellow shadow-sm animate-bounce-sm">
                        <span v-if="feedback.isMastered" class="text-5xl">🏆</span>
                        <span v-else class="text-5xl">🌟</span>
                    </div>

                    <!-- 主要文案区域 (增加 pt-6 给图标留位置) -->
                    <div class="pt-6 text-center">
                        <h3 class="text-2xl font-bold text-gray-700 font-cartoon flex items-center justify-center gap-2">
                            <!-- 掌握状态文案 -->
                            <template v-if="feedback.isMastered">
                                恭喜掌握
                                <span class="char-highlight text-4xl bg-candy-yellow text-white px-3 py-1 rounded-xl shadow-sm rotate-3 inline-block mx-1 border-b-4 border-yellow-600">
                                    {{ feedback.char }}
                                </span>
                            </template>
                            
                            <!-- 普通答对文案 -->
                            <template v-else>
                                <span class="char-highlight text-4xl bg-candy-blue text-white px-3 py-1 rounded-xl shadow-sm -rotate-3 inline-block mx-1 border-b-4 border-blue-700">
                                    {{ feedback.char }}
                                </span>
                                <span class="text-candy-green">回答正确!</span>
                            </template>
                        </h3>
                    </div>

                    <!-- 进度或奖励区域 -->
                    <div v-if="!feedback.isMastered" class="w-full max-w-sm space-y-2 mt-2">
                        <div class="flex justify-between text-gray-400 font-bold text-sm px-2">
                            <span>熟练度</span>
                            <span>{{ feedback.count }} / {{ feedback.total }}</span>
                        </div>
                        <div class="w-full h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner relative">
                            <!-- 进度条动画 -->
                            <div class="h-full bg-gradient-to-r from-candy-yellow to-orange-400 transition-all duration-700 ease-out flex items-center justify-end pr-2" :style="{ width: `${(feedback.count / feedback.total) * 100}%` }">
                                <div class="w-full h-full absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p class="text-center text-candy-blue text-xs font-bold mt-1 opacity-80">
                            再答对 {{ feedback.total - feedback.count }} 次就完全掌握啦！
                        </p>
                    </div>
                    
                    <div v-else class="text-center mt-2 animate-pulse">
                        <p v-if="feedback.reward > 0" class="text-candy-orange font-black text-2xl drop-shadow-sm">
                            魔力值 +{{ feedback.reward }} ✨
                        </p>
                        <p v-else class="text-gray-400 text-sm font-bold">
                            今日掌握名额已满
                        </p>
                    </div>
                </div>
            </div>
        </Transition>

    </MainLayout>
</template>

<style scoped>
/* 底部滑入动画 */
.slide-up-enter-active {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 带有轻微回弹效果 */
}
.slide-up-leave-active {
    transition: all 0.3s ease-in;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(100%);
}
.slide-up-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.slide-up-leave-from {
    opacity: 1;
    transform: translateY(0);
}
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(100%);
}

/* 汉字高亮强调动画 */
.char-highlight {
    animation: pop-char 0.5s ease-out 0.1s backwards;
}

@keyframes pop-char {
    0% { transform: scale(0.5) rotate(0deg); opacity: 0; }
    60% { transform: scale(1.2) rotate(5deg); }
    100% { transform: scale(1) rotate(var(--tw-rotate)); opacity: 1; }
}
</style>