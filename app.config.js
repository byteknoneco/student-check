const fs = require('fs');
const base = require('./app.json');

module.exports = () => {
  const expo = base.expo;
  const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
  const android = { ...expo.android };

  if (fs.existsSync('./google-services.json')) {
    android.googleServicesFile = './google-services.json';
  }

  return {
    ...expo,
    android,
    extra: {
      ...expo.extra,
      eas: {
        ...expo.extra?.eas,
        projectId: projectId || expo.extra?.eas?.projectId,
      },
    },
  };
};
