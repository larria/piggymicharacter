<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { tts } from '@/utils/tts';
import { PhArrowLeft, PhSword, PhShieldCheck } from '@phosphor-icons/vue';
import confetti from 'canvas-confetti';
// 【新增】引入图标
import { PhStar, PhTrophy, PhTrendUp } from '@phosphor-icons/vue';

import MainLayout from '@/components/layout/MainLayout.vue';
import GameButton from '@/components/base/GameButton.vue';
import GameProgress from '@/components/base/GameProgress.vue';
import GameModal from '@/components/base/GameModal.vue';
import CharLearningCard from '@/components/business/CharLearningCard.vue';

const router = useRouter();
const gameStore = useGameStore();

// 状态
const gameState = ref('loading'); // loading, playing, finished
const currentQuestion = ref(null);
const selectedOption = ref(null);
const isAnswered = ref(false);
const isCorrect = ref(false);
const sessionCorrectCount = ref(0);
const sessionTotalCount = ref(0);

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 复习弹窗
const showReview = ref(false);
// 【新增】控制复习卡片是否朗读完成
const isReviewFinished = ref(false);

// 每日掌握上限限制
const canEarnPoints = computed(() => gameStore.getTodayMasterCount() < gameStore.DAILY_MASTER_LIMIT);

// 怪兽/进度条状态
const dailyLimit = computed(() => gameStore.DAILY_MASTER_LIMIT);
// 【修改】回退为：只显示今日已“掌握”的字数（即答对3次的字数）
// 这样 Boss 血条更难打，但含金量更高
const progressValue = computed(() => gameStore.getTodayMasterCount());

// 【新增】答题反馈状态
const feedback = ref({
    show: false,
    isMastered: false,
    count: 0,
    total: 3, // 目标次数
    reward: 0
});

// --- 核心逻辑 ---
const initExam = () => {
    if (gameStore.learnedCharacters.length === 0) {
        router.replace('/');
        return;
    }
    gameState.value = 'playing';
    nextQuestion();
};

const nextQuestion = () => {
    // 检查是否今日已达标（可选：达标后是否强制结束？这里选择不强制，只是没奖励）
    // 生成题目
    // 【新增】重置反馈状态
    feedback.value.show = false;
    selectedOption.value = null;
    isAnswered.value = false;
    showReview.value = false;

    // 简单的题目生成算法
    const learnedChars = gameStore.learnedCharacters;
    if (learnedChars.length === 0) return;

    const targetChar = learnedChars[Math.floor(Math.random() * learnedChars.length)];
    const targetInfo = gameStore.allCharactersData.find(c => c.character === targetChar);

    // 随机挖空一个句子
    const sentence = targetInfo.example_sentences[Math.floor(Math.random() * targetInfo.example_sentences.length)];
    // 【修改】定义统一的挖空占位符
    const PLACEHOLDER = '（ __ ）';

    // 将所有出现的汉字替换为占位符
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

    // 朗读题目（稍微延迟）
    setTimeout(() => speakQuestion(), 500);
};

const speakQuestion = async () => {
    if (!currentQuestion.value) return;

    // 1. 先停止之前的声音
    tts.stop();

    const { text, placeholder } = currentQuestion.value;

    // 2. 按照占位符切割句子
    // 例如："小猫爱吃鱼" -> 挖空 "猫" -> "小（ __ ）爱吃鱼" -> parts: ["小", "爱吃鱼"]
    const parts = text.split(placeholder);

    // 3. 循环播放
    for (let i = 0; i < parts.length; i++) {
        // 如果用户已经答题了或切走了，停止播放
        if (isAnswered.value || !currentQuestion.value) break;

        // 播放文本片段 (如果片段不为空)
        if (parts[i]) {
            await tts.speak(parts[i]);
        }

        // 如果不是最后一段，说明后面紧跟着一个占位符，需要播放提示音
        if (i < parts.length - 1) {
            if (isAnswered.value) break; // 再次检查中断

            await wait(300); // 停顿 300ms

            if (isAnswered.value) break;
            await tts.speak('请咪猪头选择', { rate: 1.1 }); // 稍微快一点点，显得轻快

            if (isAnswered.value) break;
            await wait(300); // 停顿 300ms
        }
    }
};

const handleOptionClick = (option) => {
    if (isAnswered.value) return;

    // 【新增】点击瞬间，立即打断读题
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

        // 【修改】设置反馈信息
        feedback.value = {
            show: true,
            isMastered: res.isMastered,
            count: res.newCorrectCount,
            total: gameStore.REQUIRED_CORRECT_COUNT, // 默认为3
            reward: res.reward
        };

        // 如果掌握了，撒花并播放庆祝音效
        if (res.isMastered) {
            audioManager.play('celebrate');
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        // 【修改】延长等待时间到 2秒，让孩子看清反馈
        setTimeout(nextQuestion, 2000);
    } else {
        audioManager.play('wrong');
        gameStore.recordExamResult(currentQuestion.value.targetChar, false);
        // 错误后，延迟一点弹出复习卡片
        setTimeout(() => {
            // 【修正点1】打开弹窗时，重置按钮状态
            isReviewFinished.value = false;
            showReview.value = true;
        }, 1000);
    }
};

// 【新增】卡片朗读完毕的回调
const onReviewCardReadDone = () => {
    isReviewFinished.value = true;
};

// 【修改】点击按钮才进入下一题
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

                <!-- Boss 血条 (即今日掌握进度) -->
                <div class="flex-1 flex items-center gap-2 bg-white/80 px-3 py-2 rounded-xl shadow-sm">
                    <span class="text-2xl">👾</span>
                    <div class="flex-1">
                        <GameProgress :value="progressValue" :max="dailyLimit" color="bg-candy-red" />
                    </div>
                </div>
            </div>
        </template>

        <div v-if="currentQuestion" class="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-4">

            <!-- 题目区域 -->
            <div class="bg-white/90 backdrop-blur p-8 rounded-3xl shadow-xl w-full mb-8 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                <!-- 装饰背景 -->
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

                    <!-- 结果图标 -->
                    <div v-if="isAnswered && opt === currentQuestion.targetChar" class="absolute right-2 bottom-2 animate-bounce">
                        <PhShieldCheck size="24" weight="fill" />
                    </div>
                </button>
            </div>

        </div>

        <!-- 复习弹窗 -->
        <GameModal :show="showReview" title="巩固一下" :closeable="false">
            <div class="flex flex-col items-center min-h-[400px]"> <!-- 增加最小高度防止跳动 -->
                <p class="text-gray-500 mb-4">哎呀答错了，再复习一遍吧！</p>

                <!-- 【修正点2】@finish 不再直接关闭，而是显示按钮 -->
                <CharLearningCard v-if="currentQuestion" :info="currentQuestion.targetInfo" :autoPlay="true" @finish="onReviewCardReadDone" />

                <!-- 【修正点3】按钮增加显隐控制，且点击才触发关闭 -->
                <div class="mt-6 w-full transition-opacity duration-500" :class="isReviewFinished ? 'opacity-100' : 'opacity-0 pointer-events-none'">
                    <GameButton variant="primary" :block="true" @click="closeReviewAndNext">
                        记住了，下一题
                    </GameButton>
                </div>
            </div>
        </GameModal><!-- 【新增】答对反馈弹层 (Overlay) -->
        <Transition name="bounce-pop">
            <div v-if="feedback.show" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <!-- 简单的背景遮罩 -->
                <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

                <!-- 反馈卡片 -->
                <div class="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-candy-yellow flex flex-col items-center gap-4 min-w-[300px] transform scale-110">

                    <!-- 图标：掌握了显示奖杯，没掌握显示星星 -->
                    <div class="text-6xl mb-2 animate-bounce-sm">
                        <span v-if="feedback.isMastered">🏆</span>
                        <span v-else>🌟</span>
                    </div>

                    <!-- 标题 -->
                    <h3 class="text-3xl font-bold text-candy-orange font-cartoon">
                        {{ feedback.isMastered ? '恭喜掌握！' : '回答正确！' }}
                    </h3>

                    <!-- 进度条/文字 -->
                    <div v-if="!feedback.isMastered" class="w-full space-y-2">
                        <div class="flex justify-between text-gray-500 font-bold text-lg">
                            <span>熟练度</span>
                            <span>{{ feedback.count }} / {{ feedback.total }}</span>
                        </div>
                        <!-- 进度条 -->
                        <div class="w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                            <div class="h-full bg-candy-yellow transition-all duration-500" :style="{ width: `${(feedback.count / feedback.total) * 100}%` }"></div>
                        </div>
                        <p class="text-center text-candy-blue text-sm mt-2 font-bold">
                            再答对 {{ feedback.total - feedback.count }} 次就掌握啦！
                        </p>
                    </div>

                    <!-- 掌握奖励提示 -->
                    <div v-else class="text-center bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                        <p class="text-gray-600 font-bold">太棒了！你已经完全学会这个字了</p>
                        <p v-if="feedback.reward > 0" class="text-candy-orange font-bold text-xl mt-1">
                            魔力值 +{{ feedback.reward }} ✨
                        </p>
                    </div>
                </div>
            </div>
        </Transition>

    </MainLayout>
</template>

<style scoped>
/* 弹跳入场动画 */
.bounce-pop-enter-active {
    animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bounce-pop-leave-active {
    transition: opacity 0.2s ease;
}
.bounce-pop-leave-to {
    opacity: 0;
}

@keyframes bounce-in {
    0% {
        opacity: 0;
        transform: scale(0.3);
    }
    50% {
        opacity: 1;
        transform: scale(1.05);
    }
    70% {
        transform: scale(0.9);
    }
    100% {
        transform: scale(1);
    }
}
</style>