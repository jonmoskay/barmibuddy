// Metro config for Expo monorepo
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo for changes
config.watchFolders = [monorepoRoot];

// Resolve modules from the project's node_modules first, then the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force Metro to resolve symlinks (npm workspaces use them)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
