// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('metro-config').MetroConfig}
//  */
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);


// const { getDefaultConfig } = require('metro-config');

// module.exports = (async () => {
//   const config = await getDefaultConfig();
//   config.resolver.assetExts.push('mp3'); // Add support for mp3
//   return config;
// })();



// metro.config.js

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Load the default config
const defaultConfig = getDefaultConfig(__dirname);

// Add .mp3 to the list of asset extensions
defaultConfig.resolver.assetExts.push('mp3');

// Merge and export the final config
module.exports = mergeConfig(defaultConfig, {});
