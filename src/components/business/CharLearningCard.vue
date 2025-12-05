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

// 【新增】记录当前显示英文的句子索引，-1 表示没有
const flippedSentenceIndex = ref(-1);

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const shouldContinue = () => isMounted.value && isPlaying.value;

const highlightText = (text, char) => {
    if (!text || !char) return text;
    return text.replaceAll(
        char,
        `<span class="font-bold text-candy-blue text-xl inline-block mx-0.5">${char}</span>`
    );
};

// ... (playSequence 函数保持不变) ...
const playSequence = async () => {
    if (isPlaying.value) return;
    isPlaying.value = true;

    try {
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
    // 如果正在读英文，先打断
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

// 【新增】播放英文例句逻辑
const playEnglishSentence = async (index) => {
    // 安全检查：如果没有英文数据或未解锁，则不执行
    if (!isInitialPlayDone.value || !props.info.english_example_sentences?.[index]) return;

    // 打断当前的所有播放
    isPlaying.value = false;
    tts.stop();
    await wait(10); // 微小延迟确保状态重置

    // 设置状态：显示英文，高亮该行
    flippedSentenceIndex.value = index;
    activeKey.value = `sentence-${index}`;

    try {
        // 调用 TTS，指定语言为英语
        await tts.speak(props.info.english_example_sentences[index], {
            lang: 'en-US',
            rate: 0.8
        });
    } catch (e) {
        console.error('English TTS error', e);
    } finally {
        // 读完后恢复：显示回中文，取消高亮
        if (isMounted.value) {
            // 增加一点点延迟，让用户看完英文
            await wait(200);
            flippedSentenceIndex.value = -1;
            activeKey.value = '';
        }
    }
};

const toggleFlip = async () => {
    if (!isInitialPlayDone.value) return;

    isPlaying.value = false;
    tts.stop();
    activeKey.value = '';
    flippedSentenceIndex.value = -1; // 翻转时重置英文显示

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
    isMounted.value = false;
    isPlaying.value = false;
    tts.stop();
});
</script>

<template>
    <div class="perspective-container w-full max-w-md aspect-[3/4] relative select-none" :class="isInitialPlayDone ? 'cursor-pointer' : 'cursor-default'" @click="toggleFlip">
        <div class="flip-card w-full h-full transition-transform duration-700 transform-style-3d" :class="{ 'flipped': isFlipped }">

            <!-- 正面：汉字 (保持不变) -->
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

                <!-- 词语列表 (保持不变) -->
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
                    <!-- 
                        【修改】例句列表容器 
                        改为 Flex 布局以容纳右侧按钮
                    -->
                    <div v-for="(sentence, idx) in info.example_sentences" :key="idx" class="relative group">
                        <div @click.stop="playSpecific(sentence, `sentence-${idx}`)" class="flex items-start justify-between gap-2 text-lg leading-relaxed bg-white p-3 rounded-lg shadow-sm transition-all duration-300 border-l-4 min-h-[3.5rem]" :class="[
                            activeKey === `sentence-${idx}` ? 'border-candy-green bg-green-50 text-green-900 scale-105 z-10' : 'border-transparent text-gray-700',
                            isInitialPlayDone ? 'hover:bg-gray-50' : ''
                        ]">
                            <!-- 
                                【修改】内容区域 
                                根据 flippedSentenceIndex 判断显示中文还是英文
                            -->
                            <div class="flex-1 transition-opacity duration-300">
                                <span v-if="flippedSentenceIndex === idx" class="text-candy-purple font-medium font-sans">
                                    {{ info.english_example_sentences?.[idx] || 'No English Translation' }}
                                </span>
                                <!-- 使用 v-html 高亮汉字 (仅在显示中文时) -->
                                <span v-else v-html="highlightText(sentence, info.character)"></span>
                            </div>

                            <!-- 
                                【新增】翻译按钮 
                                仅在 isInitialPlayDone 为 true 且有英文数据时显示
                            -->
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