<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { PhSpeakerHigh } from '@phosphor-icons/vue';
import { tts } from '@/utils/tts';

const props = defineProps({
    info: { type: Object, required: true },
    autoPlay: { type: Boolean, default: true }
});

const emit = defineEmits(['finish']);

const isFlipped = ref(false);
const isPlaying = ref(false);
const activeKey = ref(''); // 用于记录当前正在读的内容ID，用于高亮
// 【新增】组件存活标记
const isMounted = ref(true);

// 【新增】标记初始强制播放是否完成
// 如果不自动播放，默认就是完成状态，允许交互
const isInitialPlayDone = ref(!props.autoPlay);

// 【新增】安全的延时函数
// 如果组件卸载了或停止播放了，这个等待就没意义了，虽然不能物理中断 Promise，
// 但我们可以配合下方的检查逻辑使用
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 【新增】检查是否应该继续运行
// 只有当：组件挂载中 且 播放状态为 true 时，才继续
const shouldContinue = () => isMounted.value && isPlaying.value;

// 【新增】高亮处理函数
const highlightText = (text, char) => {
    if (!text || !char) return text;
    // 使用全局替换，将目标字包裹在 span 中
    // 添加 font-bold (加粗), text-candy-blue (主题色), text-xl (稍微加大), inline-block (允许缩放), mx-0.5 (微小左右间距)
    return text.replaceAll(
        char,
        `<span class="font-bold text-candy-blue text-xl inline-block mx-0.5">${char}</span>`
    );
};

// 播放序列逻辑
const playSequence = async () => {
    if (isPlaying.value) return;
    isPlaying.value = true;

    try {
        // 1. 正面：读汉字 (3遍)
        if (!isFlipped.value) {
            for (let i = 0; i < 3; i++) {
                if (!shouldContinue()) return; // 【检查】

                activeKey.value = 'char';
                await tts.speak(props.info.character, { rate: 0.6 });

                if (!shouldContinue()) return; // 【检查】
                await wait(500);
            }
            activeKey.value = '';

            if (!shouldContinue()) return; // 【检查】
            await wait(300);

            if (!shouldContinue()) return; // 【检查】
            isFlipped.value = true;

            await wait(600); // 等待翻转动画
        }

        // 2. 背面：读词语 (全部)
        if (props.info.example_words?.length) {
            for (let i = 0; i < props.info.example_words.length; i++) {
                if (!shouldContinue()) return; // 【检查】

                activeKey.value = `word-${i}`;
                await tts.speak(props.info.example_words[i], { rate: 0.8 });

                if (!shouldContinue()) return; // 【检查】
                await wait(400);
            }
        }

        // 3. 背面：读例句 (全部)
        if (props.info.example_sentences?.length) {
            for (let i = 0; i < props.info.example_sentences.length; i++) {
                if (!shouldContinue()) return; // 【检查】

                activeKey.value = `sentence-${i}`;
                await tts.speak(props.info.example_sentences[i], { rate: 0.9 });

                if (!shouldContinue()) return; // 【检查】
                await wait(600);
            }
        }

        activeKey.value = '';
        if (shouldContinue()) {
            // 【解锁】播放完整结束，解锁交互
            isInitialPlayDone.value = true;
            emit('finish');
        }
    } catch (e) {
        console.error('TTS interrupted', e);
    } finally {
        // 只有在非强制中断的情况下才重置 isPlaying
        // 如果是因为组件卸载导致的退出，这里其实已经无所谓了
        if (isMounted.value) {
            isPlaying.value = false;
            activeKey.value = '';
        }
    }
};

// 点击重读特定项
const playSpecific = async (text, key) => {
    // 【拦截】如果还在初始强制播放中，禁止点击
    if (!isInitialPlayDone.value) return;

    // 点击特定项时，打断自动流
    isPlaying.value = false;
    tts.stop();

    // 给一点点时间让 loop 中的 check 生效退出
    await wait(10);

    activeKey.value = key;
    await tts.speak(text);

    if (isMounted.value) {
        activeKey.value = '';
    }
};

// 手动点击翻转
const toggleFlip = async () => {
    // 【拦截】如果还在初始强制播放中，禁止翻转
    if (!isInitialPlayDone.value) return;

    // 翻转时，立即打断自动流
    isPlaying.value = false;
    tts.stop();
    activeKey.value = '';

    isFlipped.value = !isFlipped.value;

    // 如果翻回正面，简单读一下字
    if (!isFlipped.value) {
        // 这里不需要 await，因为是简单的触发
        playSpecific(props.info.character, 'char');
    }
};

onMounted(() => {
    if (props.autoPlay) {
        setTimeout(playSequence, 500);
    }
});

onUnmounted(() => {
    // 【关键】标记组件已卸载
    isMounted.value = false;
    // 停止播放标记
    isPlaying.value = false;
    // 物理停止 TTS
    tts.stop();
});
</script>

<template>
    <!-- 【修改】样式绑定：如果未完成，显示 default 或 wait 光标，移除 cursor-pointer -->
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
                    <!-- 【修改】提示文案：未解锁时显示'正在朗读'，解锁后显示'点我翻转' -->
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
                        activeKey === `word-${idx}` ? 'text-white bg-candy-orange border-candy-orange scale-110 shadow-md' : 'text-dark-text border-gray-100',
                        // 【修改】未解锁时移除 hover 效果
                        isInitialPlayDone ? 'hover:bg-gray-50' : ''
                    ]">
                        {{ word }}
                    </span>
                </div>

                <h3 class="text-2xl font-bold text-candy-green mb-4">例句</h3>
                <div class="space-y-4">
                    <!-- 【修改】将插值 {{ sentence }} 改为 v-html -->
                    <p v-for="(sentence, idx) in info.example_sentences" :key="idx" @click.stop="playSpecific(sentence, `sentence-${idx}`)" class="text-lg leading-relaxed bg-white p-3 rounded-lg shadow-sm transition-all duration-300 border-l-4" :class="[
                        activeKey === `sentence-${idx}` ? 'border-candy-green bg-green-50 text-green-900 scale-105' : 'border-transparent text-gray-700',
                        isInitialPlayDone ? 'hover:bg-gray-50' : ''
                    ]" v-html="highlightText(sentence, info.character)">
                    </p>
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