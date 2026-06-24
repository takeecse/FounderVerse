const { initializeApp, getApps, cert } =
  require("firebase-admin/app");

const getServiceAccount = () => {
  const rawKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    return null;
  }

  try {
    return JSON.parse(rawKey);
  } catch (error) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON"
    );
  }
};

const serviceAccount =
  getServiceAccount();

if (!getApps().length) {
  const appOptions = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      "founderverse-8246a",
  };

  if (serviceAccount) {
    appOptions.credential =
      cert(serviceAccount);
  }

  initializeApp(appOptions);
}

module.exports = require("firebase-admin");