<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import confetti from 'canvas-confetti';

import PageHeader from '../components/PageHeader.vue';
import ProgressRing from '../components/ProgressRing.vue';
import CCard from '../components/CCard.vue';
import Utils from '../Utils.js';

const router = useRouter();
const gameStore = useGameStore();

// --- 组件状态 ---
const quizState = ref('loading');
const lastExaminedChar = ref(null);
const currentQuestion = ref(null);
const selectedAnswer = ref(null);
const isAnswered = ref(false);
const isCorrect = ref(false);
const showReviewCard = ref(false);
const isReviewCardFinished = ref(false);
const progressInfo = ref({ show: false, char: '', from: 0, to: 0 });

// --- 统计数据 ---
const sessionStats = ref({
    correct: 0,
    total: 0,
});

// --- 计算属性 ---
const examinableChars = computed(() => gameStore.learnedCharacters);
const dailyMasterLimit = computed(() => gameStore.DAILY_MASTER_LIMIT);
const todayMasteredCount = computed(() => gameStore.getTodayMasterCount());

// --- 方法 ---
const generateQuestion = () => {
    // 重置状态
    isAnswered.value = false;
    isCorrect.value = false;
    selectedAnswer.value = null;
    isReviewCardFinished.value = false;
    progressInfo.value.show = false;

    if (examinableChars.value.length === 0 || todayMasteredCount.value >= dailyMasterLimit.value) {
        quizState.value = 'finished';
        playCelebrationAnimation();
        return;
    }

    let availableChars = examinableChars.value;
    if (lastExaminedChar.value && availableChars.length > 1) {
        availableChars = availableChars.filter(c => c !== lastExaminedChar.value);
    }

    const targetChar = availableChars[Math.floor(Math.random() * availableChars.length)];
    const targetCharInfo = gameStore.allCharactersData.find(c => c.character === targetChar);
    lastExaminedChar.value = targetChar;

    const sentence = targetCharInfo.example_sentences[Math.floor(Math.random() * targetCharInfo.example_sentences.length)];
    const questionText = sentence.replace(new RegExp(targetChar, 'g'), '（__）');

    const options = new Set([targetChar]);
    const allOtherChars = gameStore.allCharactersData.filter(c => c.character !== targetChar);
    while (options.size < 4 && allOtherChars.length > 0) {
        const randomIndex = Math.floor(Math.random() * allOtherChars.length);
        options.add(allOtherChars.splice(randomIndex, 1)[0].character);
    }

    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

    currentQuestion.value = {
        targetChar,
        targetCharInfo,
        questionText,
        options: shuffledOptions,
    };
};

const speakQuestion = async () => {
    // 有bug，无法自动朗读，暂不启用
    // Utils.stopSpeak();
    // await Utils.speakText('请咪猪头回答');
    return;

    if (!currentQuestion.value) return;
    const text = currentQuestion.value.questionText;
    const parts = text.split('（__）');

    Utils.stopSpeak();

    try {
        if (parts[0]) {
            await Utils.speakText(parts[0]);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        await Utils.speakText('什么的', { rate: 1.2 });
        await new Promise(resolve => setTimeout(resolve, 500));

        if (parts[1]) {
            await Utils.speakText(parts[1]);
        }
    } catch (error) {
        // 当语音被 handleAnswer 中止时，这里可能会捕获到一个错误，属于正常现象
    }
};

const handleAnswer = (option) => {
    if (isAnswered.value) return;

    Utils.stopSpeak();

    isAnswered.value = true;
    selectedAnswer.value = option;
    sessionStats.value.total++;

    if (option === currentQuestion.value.targetChar) {
        isCorrect.value = true;
        sessionStats.value.correct++;

        const oldCorrectCount = gameStore.getCharacterCorrectCount(currentQuestion.value.targetChar);
        const result = gameStore.recordExamResult(currentQuestion.value.targetChar, true);

        progressInfo.value = {
            show: true,
            char: currentQuestion.value.targetChar,
            from: oldCorrectCount,
            to: result.newCorrectCount,
        };

        if (result.reward > 0) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        setTimeout(() => {
            generateQuestion();
            speakQuestion(); // 自动进入下一题时，需要朗读
        }, 2000);
    } else {
        isCorrect.value = false;
        gameStore.recordExamResult(currentQuestion.value.targetChar, false);

        setTimeout(() => {
            showReviewCard.value = true;
        }, 2000);
    }
};

const onReviewCardFinished = () => {
    isReviewCardFinished.value = true;
};

// ======================= BUG修复点 =======================
const goToNextQuestion = () => {
    showReviewCard.value = false;
    generateQuestion();
    // speakQuestion 内部会先调用 stopSpeak()，可中断因CCard组件重渲染而触发的错误朗读
    speakQuestion();
};
// ========================================================

const playCelebrationAnimation = () => {
    var duration = 5 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function () {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        var particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
};

onMounted(() => {
    generateQuestion();
    speakQuestion(); // 首次加载时，需要朗读
    quizState.value = 'ongoing';
});
</script>

<template>
    <div class="exam-view">
        <PageHeader>
            <template #center>
                <div class="exam-header-center">
                    <ProgressRing :progress="(todayMasteredCount / dailyMasterLimit) * 100" :text="`${todayMasteredCount}/${dailyMasterLimit}`" :size="60" />
                </div>
            </template>
        </PageHeader>

        <main class="quiz-content" v-if="quizState === 'ongoing' && currentQuestion">
            <div class="question-panel" @click="speakQuestion">
                <h2 class="question-text" :class="{ highlight: !isAnswered }">{{ currentQuestion.questionText }}</h2>
            </div>

            <div class="options-grid">
                <button v-for="option in currentQuestion.options" :key="option" @click="handleAnswer(option)" class="option-btn" :class="{
                    'correct': isAnswered && option === currentQuestion.targetChar,
                    'incorrect': isAnswered && selectedAnswer === option && option !== currentQuestion.targetChar,
                    'disabled': isAnswered
                }" :disabled="isAnswered">
                    {{ option }}
                </button>
            </div>
        </main>

        <!-- 结果动画 -->
        <div v-if="isAnswered" class="result-animation">
            <div v-if="isCorrect" class="icon-correct">✔️</div>
            <!-- <div v-if="!isCorrect" class="icon-incorrect">❌</div> -->
        </div>

        <!-- 底部进度条 -->
        <footer class="progress-footer">
            <Transition name="progress-fade">
                <div v-if="progressInfo.show" class="progress-bar">
                    <template v-if="progressInfo.to >= gameStore.REQUIRED_CORRECT_COUNT">
                        <span class="celebration">🎉 恭喜掌握 “{{ progressInfo.char }}” 字！ 🎉</span>
                    </template>
                    <template v-else>
                        <span class="char-display">{{ progressInfo.char }}</span>
                        <div class="progress-track">
                            <span class="progress-from">{{ progressInfo.from }} / {{ gameStore.REQUIRED_CORRECT_COUNT }}</span>
                            <span class="arrow">→</span>
                            <span class="progress-to">{{ progressInfo.to }} / {{ gameStore.REQUIRED_CORRECT_COUNT }}</span>
                        </div>
                    </template>
                </div>
            </Transition>
        </footer>

        <!-- 复习卡片弹窗 -->
        <van-popup v-model:show="showReviewCard" round :style="{ width: '90%', maxWidth: '600px' }" :close-on-click-overlay="false" :destroy-on-close="true">
            <div class="review-card-container">
                <CCard v-if="currentQuestion" :key="currentQuestion.targetChar" :cInfo="currentQuestion.targetCharInfo" @finished="onReviewCardFinished" />
                <button v-if="isReviewCardFinished" @click="goToNextQuestion" class="btn btn-blueberry next-btn">
                    下一题
                </button>
            </div>
        </van-popup>

        <!-- 测验结束界面 -->
        <div class="finished-screen" v-if="quizState === 'finished'">
            <h2>今日测验完成！</h2>
            <p class="accuracy">
                正确率：{{ sessionStats.total > 0 ? ((sessionStats.correct / sessionStats.total) * 100).toFixed(0) : 100 }}%
            </p>
            <button class="btn btn-grape" @click="router.push('/collection')">
                <span class="btn-emoji">🖼️</span>
                前往兑换画片
            </button>
        </div>
    </div>
</template>

<style scoped>
/* 样式保持不变 */
.exam-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.exam-header-center {
    display: flex;
    align-items: center;
    gap: 15px;
}

.quiz-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    gap: 40px;
}

.question-panel {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.question-text {
    font-size: 3rem;
    color: #333;
    text-align: center;
    font-weight: bold;
}
.question-text.highlight {
    animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    width: 100%;
    max-width: 500px;
}

.option-btn {
    padding: 20px;
    font-size: 3rem;
    font-weight: bold;
    border: none;
    border-radius: 18px;
    background: linear-gradient(145deg, #f0f0f0, #ffffff);
    box-shadow: 10px 10px 20px #d9d9d9, -10px -10px 20px #ffffff;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    color: #555;
}
.option-btn:not(:disabled):hover {
    transform: translateY(-5px);
    box-shadow: 15px 15px 30px #d9d9d9, -15px -15px 30px #ffffff;
}
.option-btn:not(:disabled):active {
    transform: translateY(-2px);
    box-shadow: 8px 8px 16px #d9d9d9, -8px -8px 16px #ffffff;
}
.option-btn.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.option-btn.correct {
    background: linear-gradient(145deg, #a8ff78, #78ffd6);
    color: white;
    animation: correct-bounce 0.5s;
}

.option-btn.incorrect {
    background: linear-gradient(145deg, #ff5e62, #ff9966);
    color: white;
    animation: incorrect-shake 0.5s;
}

.result-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    z-index: 999;
}

.result-animation [class*="icon-"] {
    font-size: 15rem;
    animation: result-pop 0.5s ease-out;
    text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

@keyframes result-pop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    60% {
        transform: scale(1.2);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes correct-bounce {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

@keyframes incorrect-shake {
    0%, 100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-10px);
    }
    75% {
        transform: translateX(10px);
    }
}

.review-card-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.next-btn {
    width: 80%;
}

.finished-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 30px;
    text-align: center;
}

.finished-screen h2 {
    font-size: 2.5rem;
    color: #4CAF50;
}

.finished-screen .accuracy {
    font-size: 1.8rem;
    color: #555;
}

.progress-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    pointer-events: none;
}

.progress-bar {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 15px 30px;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 1.5rem;
    font-weight: bold;
}

.char-display {
    font-size: 2rem;
    background-color: #ffc107;
    color: #333;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
}

.progress-track {
    display: flex;
    align-items: center;
    gap: 10px;
}

.progress-from {
    opacity: 0.7;
}

.arrow {
    color: #ffc107;
    animation: arrow-move 0.5s ease-in-out infinite alternate;
}

@keyframes arrow-move {
    from {
        transform: translateX(-3px);
    }
    to {
        transform: translateX(3px);
    }
}

.progress-to {
    transform: scale(1.2);
    color: #8bc34a;
}

.celebration {
    font-size: 1.5rem;
    color: #ffeb3b;
    animation: celebration-glow 1.5s infinite;
}

@keyframes celebration-glow {
    0%, 100% {
        text-shadow: 0 0 5px #fff, 0 0 10px #ffeb3b, 0 0 15px #ffc107;
    }
    50% {
        text-shadow: 0 0 10px #fff, 0 0 20px #ffeb3b, 0 0 30px #ffc107;
    }
}

.progress-fade-enter-active,
.progress-fade-leave-active {
    transition: all 0.5s ease;
}

.progress-fade-enter-from,
.progress-fade-leave-to {
    opacity: 0;
    transform: translateY(100%);
}
</style>