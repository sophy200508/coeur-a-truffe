export default {
  expo: {
    name: "coeur-a-truffe",
    slug: "coeur-a-truffe",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.sophy.coeurattruffe"
    },
    android: {
      package: "com.sophy.coeurattruffe",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        "projectId": "fe899711-88cf-42e8-b194-d5609949ac62"
      }
    }
  }
};
