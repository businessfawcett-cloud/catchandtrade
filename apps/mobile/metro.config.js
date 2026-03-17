const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const mobileModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enablePackageExports = false;

config.resolver.nodeModulesPaths = [
  mobileModules,
  path.resolve(monorepoRoot, 'node_modules'),
];

config.watchFolders = [monorepoRoot];

// Hard aliases: ANY import of these packages resolves to mobile's copy.
// This is critical because the web workspace uses React 18 (hoisted to root)
// while mobile uses React 19. Without this, packages hoisted to root
// (e.g. @react-navigation) would import root's React 18 and cause
// "Invalid hook call" errors due to duplicate React instances.
const forceLocal = {
  'react': path.resolve(mobileModules, 'react'),
  'react-dom': path.resolve(mobileModules, 'react-dom'),
  'react-native': path.resolve(mobileModules, 'react-native'),
};

config.resolver.extraNodeModules = forceLocal;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // For react/react-native, always resolve to mobile's node_modules
  // regardless of where the importing module lives
  const base = moduleName.split('/')[0];
  if (forceLocal[base]) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [mobileModules] }),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
