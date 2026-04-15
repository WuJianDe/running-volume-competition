import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AdminView from '@/views/AdminView.vue'
import RunnerView from '@/views/RunnerView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/admin', component: AdminView },
    { path: '/runner/:id', component: RunnerView },
  ],
})

export default router
