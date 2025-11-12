import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import cData from '@/assets/data/data-full-all.json'

export const useLearnProgressStore = defineStore('learnProgress', () => {
    const learned = ref([]);

    const addLearned = (item, date) => {
        // 参数验证
        if (!item || !item.character) {
            console.warn('addLearned: 参数无效，缺少 character 属性', item);
            return;
        }

        const character = item.character;

        // 检查是否已经学习过这个字符
        const alreadyLearned = learned.value.some(learnedItem =>
            learnedItem.character === character
        );

        const time = date instanceof Date ? date.toLocaleString() : new Date().toLocaleString();

        if (!alreadyLearned) {
            learned.value.push({
                character,
                time,
            });
        } else {
            console.log(`字符 "${character}" 已经学习过了`);
        }
    }

    const learnedPercent = computed(() => {
        const percent = learned.value.length / cData.length;

        // 如果进度达到100%，显示100%
        if (percent >= 1) {
            return '100%';
        }

        // 如果进度小于100%，计算保留1位小数的百分比，但最多显示99.9%
        const displayPercent = Math.min(percent, 0.999) * 100;
        return `${displayPercent.toFixed(1)}%`;
    });

    return { learned, addLearned, learnedPercent }
}, {
    // 持久化配置
    persist: {
        key: 'learn-progress', // 存储的键名
        storage: localStorage, // 存储方式
        // paths: ['learned'] // 如果需要只持久化特定状态，可以取消注释
    }
})
