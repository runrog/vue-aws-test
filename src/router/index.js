/* eslint global-require: 0 */
import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: require('@/layout/full-page/').default,
      children: [],
    },
  ],
});
