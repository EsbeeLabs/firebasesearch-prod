var _ = require('lodash');

module.exports = function (ref) {
  var postsRef = ref.child('Posts');
  var commentsSearchRef = ref.child('Search/Comments');

  function formatComment(postId, comment) {
    return {
      postId: postId,
      userComment: comment || null,
      userCommentParts: !comment ? null : comment.split(' ').filter(function (part) {
        return part.length > 2
      })
    };
  };

  function syncPostComments(postId, post) {
    var commentKeys = Object.keys(post.comments || {});
    var i = commentKeys.length;
    var updates = {};
    var key;
    var comment;

    while (i--) {
      key = commentKeys[i];
      comment = post.comments[key];
      updates[key] = formatComment(postId, comment.userComment);
    }
    return commentsSearchRef.update(updates);
  };

  function removePostComments(postId) {
    return commentsSearchRef.orderByChild('postId').equalTo(postId).once('value')
      .then(function (snap) {
        var commentSearchKeys = Object.keys(snap.val() || {});
        var i = commentSearchKeys.length;
        var updates = {};

        while (i--) {
          updates[commentSearchKeys[i]] = null;
        }

        return commentsSearchRef.update(updates);
      });
  };

  function updatePostComments(postId, post) {
    var postComments = post.comments || {};
    var commentKeys = Object.keys(postComments);
    return commentsSearchRef.orderByChild('postId').equalTo(postId).once('value')
      .then(function (snap) {
        var updates = {};
        var searchKeys = Object.keys(snap.val() || {});
        var toRemove = _.difference(searchKeys, commentKeys);

        toRemove.forEach(function (key) {
          updates[key] = null;
        });

        for (var key in postComments) {
          updates[key] = formatComment(postId, postComments[key].userComment);
        }

        return commentsSearchRef.update(updates);
      });
  };

  var handlers = [];
  function listenToPosts() {
    var addedHandler = postsRef.orderByKey().limitToLast(1).on('child_added', function (snap) {
      syncPostComments(snap.key, snap.val())
        .catch(function () {
          console.log('syncPostComments error', err);
        });
    });

    var removedHandler = postsRef.on('child_removed', function (snap) {
      removePostComments(snap.key);
    });

    var changedHandler = postsRef.on('child_changed', function (snap) {
      updatePostComments(snap.key, snap.val());
    });

    handlers.push({
      event: 'child_added',
      func: addedHandler
    });
    handlers.push({
      event: 'child_removed',
      func: removedHandler
    });
    handlers.push({
      event: 'child_changed',
      func: changedHandler
    });

    return true;
  };

  function stopListening() {
    handlers.forEach(function (handler) {
      postsRef.off(handler.event, handler.func);
    });
  };

  function startListening() {
    handlers.forEach(function (handler) {
      postsRef.on(handler.event, handler.func);
    });
  };

  function rebuild() {
    stopListening();

    return commentsSearchRef.remove()
      .then(function () {
        return postsRef.orderByKey().limitToLast(1).once('value');
      })
      .then(function (snap) {
        var keys = Object.keys(snap.val() || {});

        if (!keys.length) return Promise.reject('keys missing');
        return keys[0];
      })
      .then(function (lastKey) {
        return new Promise(function (resolve, reject) {
          var query = postsRef.orderByKey();
          function handlePost(snap) {
            updatePostComments(snap.key, snap.val())
              .then(function () {
                if (lastKey == snap.key) {
                  query.off('child_added', handlePost);
                  resolve();
                }
              });
          };

          query.on('child_added', handlePost);
        });
      })
      .then(function () {
        startListening();
        return true;
      });
  };

  return {
    syncPostComments: syncPostComments,
    updatePostComments: updatePostComments,
    removePostComments: removePostComments,
    listenToPosts: listenToPosts,
    stopListening: stopListening,
    startListening: startListening,
    rebuild: rebuild
  };
};