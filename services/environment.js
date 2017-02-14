var env;

try {
  env = require('../environment.json');
  var serviceAccount = require(env.firebaseConfig.serviceAccount);
  env.firebaseConfig.serviceAccount = {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key
  }
} catch (e) {
  env = {
    "firebaseConfig": {
      "serviceAccount": {
        "projectId": process.env.FIREBASE_PROJECT_ID,
        "clientEmail": process.env.FIREBASE_CLIENT_EMAIL,
        "privateKey": process.env.FIREBASE_PRIVATE_KEY,
      },
      "databaseURL": process.env.FIREBASE_DATABASE_URL
    },
    "algolia": {
      "applicationID": process.env.ALGOLIA_APPLICATION_ID,
      "searchAPIKey": process.env.ALGOLIA_SEARCH_API_KEY,
      "monitoringAPIKey": process.env.ALGOLIA_MONITORING_API_KEY,
      "apiKey": process.env.ALGOLIA_API_KEY
    }
  };
}

module.exports = env;