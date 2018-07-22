import * as types from '@/store/mutation-types';

const state = {
  pages: [],
};

const getters = {
  pages(s) {
    return s.pages;
  },
};

const mutations = {
  [types.GET_PAGES]() {
  },
};

const actions = {
  getPages: ({ commit }, payload) => {
    commit(types.GET_PAGES, payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
