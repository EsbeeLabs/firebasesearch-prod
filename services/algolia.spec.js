const admin = require('firebase-admin');
const env = require('../environment.test.json');
var credential = admin.credential.cert(env.firebaseConfig.serviceAccount);

admin.initializeApp({
  databaseURL: env.firebaseConfig.databaseURL,
  credential
});
const ref = admin.database().ref('test/algolia-service');
const AlgoliaService = require('./algolia');

let searchRef, algoliaService, search;
beforeEach(() => {
  algoliaService = new AlgoliaService(ref, { index: 'test:comments', env: env });
  search = algoliaService.search;
  searchRef = ref.child('Search/Comments');
});

describe('Aloglia Service', () => {
  beforeEach(done =>
    clean().then(() => {
      search.algolia.search('test').then(res => {
        expect(res.nbHits).toEqual(0);
        done();
      });
    }));
  afterEach(done => clean().then(done));

  function clean() {
    return Promise.resolve().then(() => searchRef.remove()).then(() => search.algolia.clearIndex(true));
  }

  it(
    'should sync new items up to Algolia',
    done => {
      const fakeEntries = createFakeEntries();
      const updates = fakeEntries.reduce(
        (updates, entry) => {
          updates[entry.postId] = entry;
          return updates;
        },
        {}
      );

      let counter = 0;
      let results = [];
      search.on('algolia_child_added', function(record) {
        counter++;
        results.push(record.postId);
        if (counter == 5) {
          expect(results.sort().join()).toEqual('test-0,test-1,test-2,test-3,test-4');
          done();
        }
      });

      // searchRef.on('child_added', snap => {
      //   console.log('child_added', snap.ref.toString());
      // });

      algoliaService.start().then(() => searchRef.update(updates));
    },
    60000
  );

  function createFakeEntries(n = 5) {
    var i = n;
    var fakeEntries = [];
    while (i--) {
      fakeEntries.push({
        postId: `test-${i}`,
        userComment: `#fake #${i}`,
        userCommentParts: ['#fake', `#${i}`]
      });
    }
    return fakeEntries;
  }
});
