import Vue from 'vue';
import Vuex from 'vuex';
import Globals from '@/vuex';
import AppView from '@/app-view/vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    Globals,
    AppView,
  },
  strict: true,
});

export default store;
