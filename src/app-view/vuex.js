import * as types from '@/store/mutation-types';

const state = {
  session: false,
  identityId: null,
};

const getters = {
  session(s) {
    return s.session;
  },
  identityId(s) {
    return s.identityId;
  },
};

const mutations = {
  [types.SET_SESSION](state, p) {
    state.session = p.session;
  },
  [types.SET_IDENTITY_ID](state, p) {
    state.identityId = p.identityId;
  },
};

const actions = {
  setSession: ({ commit }, payload) => {
    commit(types.SET_SESSION, payload);
  },
  setIdentityId: ({ commit }, payload) => {
    commit(types.SET_IDENTITY_ID, payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
};
