import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/project',
            name: 'project',
            component: () => import('../views/ProjectView.vue')
        },
        {
            path: '/planner',
            name: 'planner',
            component: () => import('../views/ClusterPlannerView.vue')
        },
        {
            path: '/summary',
            name: 'summary',
            component: () => import('../views/SummaryView.vue')
        }
    ]
})

export default router
