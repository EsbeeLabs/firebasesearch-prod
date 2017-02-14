var FirebaseSearch = require('quiver-firebase-search');
var env = require('./environment');

module.exports = function (ref) {
  var commentsSearchRef = ref.child('Search/Comments');
  var search = new FirebaseSearch(commentsSearchRef, {
    algolia: env.algolia
  }, 'Comments');

  return {
    build: search.algolia.firebase.build.bind(search.algolia.firebase),
    start: search.algolia.firebase.start.bind(search.algolia.firebase),
    stop: search.algolia.firebase.stop.bind(search.algolia.firebase),
    search: search
  };
};