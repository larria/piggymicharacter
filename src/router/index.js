import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      // meta: {
      //   title: '识字学习',
      //   keepAlive: true
      // }
    },
    {
      path: '/exam',
      name: 'exam',
      component: () => import('../views/ExamView.vue'),
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('../views/MyCCardsView.vue'),
    },
    {
      path: '/collection',
      name: 'collection',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/MyPCardsView.vue'),
    },
  ],
})

export default router
