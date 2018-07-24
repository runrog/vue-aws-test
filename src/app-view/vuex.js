import * as types from '@/store/mutation-types';

const state = {
  session: false,
};

const getters = {
  session(s) {
    return s.session;
  },
};

const mutations = {
  [types.SET_SESSION](state, p) {
    state.session = p.session;
  },
};

const actions = {
  setSession: ({ commit }, payload) => {
    commit(types.SET_SESSION, payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
