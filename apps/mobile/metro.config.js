const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const mobileModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enablePackageExports = false;

// Packages that MUST resolve from mobile's node_modules (React 19)
const forceLocal = {
  'react': path.resolve(mobileModules, 'react'),
  'react-dom': path.resolve(mobileModules, 'react-dom'),
  'react-native': path.resolve(mobileModules, 'react-native'),
};

config.resolver.nodeModulesPaths = [
  mobileModules,
  path.resolve(monorepoRoot, 'node_modules'),
];

config.watchFolders = [monorepoRoot];

// Intercept all resolution to force react packages from mobile node_modules
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is a package we need to force-resolve locally
  for (const [pkg, pkgPath] of Object.entries(forceLocal)) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      const newContext = {
        ...context,
        nodeModulesPaths: [mobileModules],
      };
      if (originalResolveRequest) {
        return originalResolveRequest(newContext, moduleName, platform);
      }
      return context.resolveRequest(newContext, moduleName, platform);
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
