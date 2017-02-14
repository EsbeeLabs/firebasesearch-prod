var admin = require("firebase-admin");
var env = require('./services/environment');
var _ = require('lodash');
var credential = admin.credential.cert(env.firebaseConfig.serviceAccount);

credential.certificate_.privateKey = credential.certificate_.privateKey.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: credential,
  databaseURL: env.firebaseConfig.databaseURL
});

var ref = admin.database().ref();
var searchService = require('./services/search')(ref);
var algoliaService = require('./services/algolia')(ref);

algoliaService.start()
  .then(function() {
    return searchService.listenToPosts();    
  });


ref.child('Queue/rebuild').on('child_changed', function () {
  algoliaService.stop();

  return searchService.rebuild()
    .then(function () {
      return algoliaService.build();
    })
    .then(function () {
      return algoliaService.start();
    });
});

// Use .build to delete and rebuild Algolia
// search.algolia.firebase.build();

// Use search.algolia.index to access the entire Algolia API

