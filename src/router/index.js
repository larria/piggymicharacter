import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// 【新增】引入 store 用于路由守卫判断
import { useGameStore } from '@/stores/game'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/study',
      name: 'study',
      component: () => import('../views/StudyView.vue'),
    },
    {
      path: '/exam',
      name: 'exam',
      component: () => import('../views/ExamView.vue'),
      // 【新增】路由独享守卫，拦截条件不足的进入
      beforeEnter: (to, from, next) => {
        const gameStore = useGameStore()
        const count = gameStore.learnedCharacters.length
        // 判断逻辑：如果已学字数少于最低要求
        if (count < gameStore.MIN_REVIEW_COUNT) {
          // 可以选择重定向回首页，或者不做跳转
          // 这里选择重定向回首页
          next('/') 
        } else {
          next()
        }
      }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('../views/MyCCardsView.vue'),
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('../views/MyPCardsView.vue'),
    },
  ],
})

export default router