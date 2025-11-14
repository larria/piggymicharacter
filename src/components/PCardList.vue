<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

import PCard from '../components/PCard.vue'
import ProgressRing from '../components/ProgressRing.vue'

import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const pCardTotalLen = 32

const CARD_COST = gameStore.CARD_COST;

const handleClick = (cId) => {
    // console.log(id)
    if (gameStore.collectedCards.includes(cId)) {
        console.log('已经解锁，展开img')
        const startPosition = gameStore.collectedCards.indexOf(cId);
        showImagePreview({
            // images: [
            //     'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
            //     'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
            // ],
            images: gameStore.collectedCards.map((cId) => {
                return new URL(`../assets/images/cards/c${cId}.jpg`, import.meta.url).href;
            }),
            startPosition,
        });
        return
    } else {
        if (gameStore.magicPoints >= CARD_COST) {
            showConfirmDialog({
                message:
                    `是否消耗${CARD_COST}魔力解锁卡片？`,
            })
                .then(() => {
                    gameStore.exchangeCard(cId);
                    showSuccessToast('🐷 恭喜，解锁成功～');
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                })
                .catch(() => {
                    // on cancel
                });
        } else {
            console.log('魔力不足')
            showFailToast('魔力不足，无法解锁')
        }
    }
}
</script>

<template>

    <div class="static-wrap">
        <p>解锁进度</p>
        <ProgressRing :progress="(gameStore.collectedCards.length / pCardTotalLen) * 100" :text="`${gameStore.collectedCards.length}/${pCardTotalLen}`" :size="50" />
    </div>
    <section class="pcard-list">
        <PCard :cId="(i - 1).toString()" :unlockProgress="gameStore.collectedCards.includes(i - 1) ? 1 : 0" v-for="i in pCardTotalLen" :key="i" @click="handleClick(i - 1)"></PCard>
    </section>
</template>

<style scoped>
.pcard-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
}

.static-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 10px 0;
}
</style>