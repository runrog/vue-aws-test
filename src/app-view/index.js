import Vue from 'vue';

const template = require('./template.html');

export default Vue.component('app-view', {
  template,
  name: 'full-page',
  data() {
    return {};
  },
  created() {
    this.$log.info('app created');
  },
  methods: {},
});
