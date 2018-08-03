import Vue from 'vue';
import Vuex from 'vuex';
import AppView from '@/app-view/vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    AppView,
  },
  strict: true,
});

export default store;
