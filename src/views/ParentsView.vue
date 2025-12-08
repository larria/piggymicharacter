<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { audioManager } from '@/utils/audio';
import { showToast } from '@/utils/gameToast';
import { PhArrowLeft, PhMagicWand, PhCheckCircle, PhMagnifyingGlass } from '@phosphor-icons/vue';
import MainLayout from '@/components/layout/MainLayout.vue';

const router = useRouter();
const gameStore = useGameStore();

// 搜索过滤
const searchText = ref('');

// 根据搜索词过滤未掌握的汉字列表
const filteredList = computed(() => {
    const list = gameStore.notMasteredCharacters;
    if (!searchText.value) return list;
    return list.filter(char => char.includes(searchText.value));
});

// 处理一键掌握
const handleQuickMaster = (char) => {
    // 1. 调用 Store 里的金手指方法 (在第一步中已添加)
    const res = gameStore.cheatMasterCharacter(char);

    // 2. 反馈
    if (res.success) {
        audioManager.play('correct');
        // 显示更明确的提示
        showToast(`"${char}" 已强制设为掌握！\n魔力值 +6`, 'success', 1500);
    }
};
</script>

<template>
    <!-- 背景使用稍微深一点的，体现后台感，或者复用通用的 -->
    <MainLayout bgImage="bg_museum.jpg">
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <!-- 返回按钮 -->
                <button @click="router.push('/')" class="p-2 bg-white/50 rounded-full hover:bg-white transition shadow-sm">
                    <PhArrowLeft size="24" weight="bold" class="text-dark-text" />
                </button>

                <!-- 标题栏 -->
                <div class="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border-2 border-candy-purple shadow-md">
                    <PhMagicWand size="24" weight="fill" class="text-candy-purple" />
                    <div class="text-lg font-bold text-candy-purple font-cartoon">家长金手指</div>
                </div>

                <!-- 简单的说明 (右侧) -->
                <div class="hidden md:block text-sm text-candy-purple font-bold ml-auto bg-white/80 px-4 py-2 rounded-xl shadow-sm border border-white">
                    ✨ 点击汉字可立即设为“已掌握”
                </div>
            </div>
        </template>

        <div class="flex-1 flex flex-col overflow-hidden p-2 md:p-4 pb-safe">

            <!-- 搜索框区域 -->
            <div class="mb-6 flex justify-center flex-shrink-0">
                <div class="relative w-full max-w-md group">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-candy-purple/50 group-focus-within:text-candy-purple transition-colors">
                        <PhMagnifyingGlass size="24" weight="bold" />
                    </div>
                    <input v-model="searchText" placeholder="搜索想要“掌握”的字..." class="w-full pl-12 pr-6 py-3 rounded-2xl border-2 border-white/60 bg-white/80 focus:bg-white focus:border-candy-purple outline-none shadow-lg text-lg text-dark-text placeholder-gray-400 transition-all" />
                </div>
            </div>

            <!-- 列表区域 -->
            <div class="flex-1 overflow-y-auto no-scrollbar">
                <div v-if="filteredList.length > 0" class="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 shadow-inner border border-white/50 min-h-[300px]">
                    <div class="flex flex-wrap gap-4 justify-center content-start">
                        <button v-for="char in filteredList" :key="char" @click="handleQuickMaster(char)" class="relative group w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold bg-white border-b-[6px] border-gray-200 text-gray-600 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600 hover:bg-candy-green hover:text-white hover:shadow-xl active:translate-y-1 active:border-b-0 active:shadow-none">
                            {{ char }}

                            <!-- Hover 时的对勾图标提示 -->
                            <div class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 scale-0 group-hover:scale-100 bg-white rounded-full text-candy-green shadow-sm">
                                <PhCheckCircle weight="fill" size="24" />
                            </div>
                        </button>
                    </div>
                </div>

                <!-- 空状态 (全都掌握了，或者搜索不到) -->
                <div v-else class="flex flex-col items-center justify-center h-full text-white/80 pb-20">
                    <div class="text-8xl mb-4 animate-bounce-sm">🎉</div>
                    <p class="text-2xl font-bold font-cartoon text-shadow-sm">
                        {{ searchText ? '没有找到这个字哦' : '太厉害了！所有汉字都已掌握！' }}
                    </p>
                </div>
            </div>
        </div>
    </MainLayout>
</template>

<style scoped>
/* 增加文字阴影，在复杂背景上更清晰 */
.text-shadow-sm {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>