import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useGameStore } from '@/stores/game'
import { hideToast } from '@/utils/gameToast'

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
      beforeEnter: (to, from, next) => {
        const gameStore = useGameStore()
        const count = gameStore.learnedCharacters.length
        if (count < gameStore.MIN_REVIEW_COUNT) {
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
    // 【新增】家长金手指页面
    {
      path: '/parents-god-mode',
      name: 'parents',
      component: () => import('../views/ParentsView.vue'),
    },
  ],
})

// 全局前置守卫：路由跳转开始时，立即关闭 Toast
router.beforeEach((to, from, next) => {
  hideToast()
  next()
})

export default router