<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/game'
import CCard from './components/CCard.vue'
import PCard from './components/PCard.vue'
import cData from '@/assets/data/data-full-all.json'

import HelloWorld from './components/HelloWorld.vue'

const router = useRouter()
const gameStore = useGameStore()

const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment } = counterStore
</script>

<template>
  <!-- <RouterView /> -->
   <router-view v-slot="{ Component }">
      <keep-alive include="Home,Study,Test,Collection,Statistics">
        <component :is="Component" />
      </keep-alive>
    </router-view>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
