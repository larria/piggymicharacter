<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { PhSpeakerHigh, PhTranslate } from '@phosphor-icons/vue';
import { tts } from '@/utils/tts';

const props = defineProps({
    info: { type: Object, required: true },
    autoPlay: { type: Boolean, default: true }
});

const emit = defineEmits(['finish']);

const isFlipped = ref(false);
const isPlaying = ref(false);
const activeKey = ref('');
const isMounted = ref(true);
const isInitialPlayDone = ref(!props.autoPlay);
const flippedSentenceIndex = ref(-1);

// 【新增】播放会话 ID，解决竞态问题
const playbackSessionId = ref(0);

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const shouldContinue = () => isMounted.value && isPlaying.value;

const highlightText = (text, char) => {
    if (!text || !char) return text;
    return text.replaceAll(
        char,
        `<span class="font-bold text-candy-blue text-xl inline-block mx-0.5">${char}</span>`
    );
};

const playSequence = async () => {
    if (isPlaying.value) return;
    isPlaying.value = true;

    // 自动播放开始，更新会话ID，防止之前的残留逻辑干扰
    playbackSessionId.value++;

    try {
        // ... (自动播放逻辑保持不变，省略中间代码，直接到底部) ...
        // 1. 正面：读汉字
        if (!isFlipped.value) {
            for (let i = 0; i < 3; i++) {
                if (!shouldContinue()) return;
                activeKey.value = 'char';
                await tts.speak(props.info.character, { rate: 0.6 });
                if (!shouldContinue()) return;
                await wait(1000);
            }
            activeKey.value = '';
            if (!shouldContinue()) return;
            await wait(300);
            if (!shouldContinue()) return;
            isFlipped.value = true;
            await wait(600);
        }

        // 2. 背面：读词语
        if (props.info.example_words?.length) {
            for (let i = 0; i < props.info.example_words.length; i++) {
                if (!shouldContinue()) return;
                activeKey.value = `word-${i}`;
                await tts.speak(props.info.example_words[i], { rate: 0.8 });
                if (!shouldContinue()) return;
                await wait(1000);
            }
        }

        // 3. 背面：读例句
        if (props.info.example_sentences?.length) {
            for (let i = 0; i < props.info.example_sentences.length; i++) {
                if (!shouldContinue()) return;
                activeKey.value = `sentence-${i}`;
                await tts.speak(props.info.example_sentences[i], { rate: 0.9 });
                if (!shouldContinue()) return;
                await wait(1000);
            }
        }

        activeKey.value = '';
        if (shouldContinue()) {
            isInitialPlayDone.value = true;
            emit('finish');
        }
    } catch (e) {
        console.error('TTS interrupted', e);
    } finally {
        if (isMounted.value) {
            isPlaying.value = false;
            activeKey.value = '';
        }
    }
};

// 点击重读特定项 (中文)
const playSpecific = async (text, key) => {
    if (!isInitialPlayDone.value) return;

    // 【修改】让旧的英文播放逻辑失效
    playbackSessionId.value++;

    if (flippedSentenceIndex.value !== -1) {
        flippedSentenceIndex.value = -1;
    }

    isPlaying.value = false;
    tts.stop();
    await wait(10);

    activeKey.value = key;
    await tts.speak(text);

    if (isMounted.value) {
        activeKey.value = '';
    }
};

// 播放英文例句逻辑
const playEnglishSentence = async (index) => {
    if (!isInitialPlayDone.value || !props.info.english_example_sentences?.[index]) return;

    // 1. 生成本次播放的唯一 ID
    const currentSessionId = ++playbackSessionId.value;

    // 2. 状态设置
    isPlaying.value = false;
    tts.stop();
    await wait(10);

    // 这里再次检查 ID，防止 await 10ms 期间又被点击了
    if (playbackSessionId.value !== currentSessionId) return;

    flippedSentenceIndex.value = index;
    activeKey.value = `sentence-${index}`;

    try {
        await tts.speak(props.info.english_example_sentences[index], {
            lang: 'en-US',
            rate: 0.8
        });
    } catch (e) {
        console.error('English TTS error', e);
    } finally {
        // 【核心修改】只有当 ID 依然匹配时，才执行重置
        // 如果这期间用户点击了别的（sessionId 变了），这里的重置就不执行
        if (isMounted.value && playbackSessionId.value === currentSessionId) {
            await wait(200);
            // wait 之后再次检查（双重保险）
            if (playbackSessionId.value === currentSessionId) {
                flippedSentenceIndex.value = -1;
                activeKey.value = '';
            }
        }
    }
};

const toggleFlip = async () => {
    if (!isInitialPlayDone.value) return;

    // 【修改】翻转时也使旧逻辑失效
    playbackSessionId.value++;

    isPlaying.value = false;
    tts.stop();
    activeKey.value = '';
    flippedSentenceIndex.value = -1;

    isFlipped.value = !isFlipped.value;
    if (!isFlipped.value) {
        playSpecific(props.info.character, 'char');
    }
};

onMounted(() => {
    if (props.autoPlay) {
        setTimeout(playSequence, 500);
    }
});

onUnmounted(() => {
    // 卸载时增加 ID，确保未完成的 finally 块不执行任何逻辑
    playbackSessionId.value++;
    isMounted.value = false;
    isPlaying.value = false;
    tts.stop();
});
</script>

<template>
    <!-- Template 部分完全不需要修改，保持原样即可 -->
    <div class="perspective-container w-full max-w-md aspect-[3/4] relative select-none" :class="isInitialPlayDone ? 'cursor-pointer' : 'cursor-default'" @click="toggleFlip">
        <div class="flip-card w-full h-full transition-transform duration-700 transform-style-3d" :class="{ 'flipped': isFlipped }">

            <!-- 正面：汉字 -->
            <div class="front absolute inset-0 backface-hidden bg-white rounded-3xl border-4 border-candy-blue shadow-xl flex flex-col items-center justify-center overflow-hidden">
                <div class="absolute top-4 right-4 text-candy-blue opacity-50">
                    <PhSpeakerHigh size="32" />
                </div>
                <div class="text-gray-500 text-4xl font-mono mb-4 tracking-widest">{{ info.pinyin }}</div>
                <div class="text-[10rem] leading-none font-bold text-dark-text font-sans transition-all duration-300" :class="{ 'scale-110 text-candy-blue drop-shadow-lg': activeKey === 'char' }">
                    {{ info.character }}
                </div>
                <div class="mt-12 text-candy-blue animate-bounce-sm text-lg font-bold">
                    {{ isInitialPlayDone ? '点我翻转 ↷' : '👂 仔细听哦...' }}
                </div>
            </div>

            <!-- 背面：词句 -->
            <div class="back absolute inset-0 backface-hidden bg-paper-white rounded-3xl border-4 border-candy-orange shadow-xl rotate-y-180 flex flex-col p-6 overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-candy-orange">词语</h3>
                    <div class="text-candy-orange opacity-50">
                        <PhSpeakerHigh size="24" weight="bold" />
                    </div>
                </div>

                <div class="flex flex-wrap gap-3 mb-8">
                    <span v-for="(word, idx) in info.example_words" :key="word" @click.stop="playSpecific(word, `word-${idx}`)" class="px-4 py-2 bg-white rounded-xl text-xl font-bold shadow-sm border transition-all duration-300" :class="[
                        activeKey === `word-${idx}` ? 'bg-candy-orange border-candy-orange scale-110 shadow-md' : 'border-gray-100',
                        isInitialPlayDone ? 'hover:bg-gray-50' : ''
                    ]">
                        {{ word }}
                    </span>
                </div>

                <h3 class="text-2xl font-bold text-candy-green mb-4">例句</h3>
                <div class="space-y-4">
                    <div v-for="(sentence, idx) in info.example_sentences" :key="idx" class="relative group">
                        <div @click.stop="playSpecific(sentence, `sentence-${idx}`)" class="flex items-start justify-between gap-2 text-lg leading-relaxed bg-white p-3 rounded-lg shadow-sm transition-all duration-300 border-l-4 min-h-[3.5rem]" :class="[
                            activeKey === `sentence-${idx}` ? 'border-candy-green bg-green-50 text-green-900 scale-105 z-10' : 'border-transparent text-gray-700',
                            isInitialPlayDone ? 'hover:bg-gray-50' : ''
                        ]">
                            <div class="flex-1 transition-opacity duration-300">
                                <span v-if="flippedSentenceIndex === idx" class="text-candy-purple font-medium font-sans">
                                    {{ info.english_example_sentences?.[idx] || 'No English Translation' }}
                                </span>
                                <span v-else v-html="highlightText(sentence, info.character)"></span>
                            </div>

                            <button v-if="isInitialPlayDone && info.english_example_sentences?.[idx]" @click.stop="playEnglishSentence(idx)" class="p-2 -mr-1 rounded-full text-gray-300 hover:text-candy-purple hover:bg-purple-50 active:scale-90 transition-all" :class="{ 'text-candy-purple bg-purple-100 animate-pulse': flippedSentenceIndex === idx }" title="听英文">
                                <PhTranslate size="20" weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.perspective-container {
    perspective: 1000px;
}
.transform-style-3d {
    transform-style: preserve-3d;
}
.backface-hidden {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}
.rotate-y-180 {
    transform: rotateY(180deg);
}
.flipped {
    transform: rotateY(180deg);
}
</style>