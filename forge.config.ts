module.exports = {
  packagerConfig: {
    // Do not include in the build src
    ignore: [
      /^\/src/,
      /^\/.vscode/,
      /^\/.github/,
      /(biome.json)|(.gitignore)|(vite.config.ts)|(forge.config.ts)|(tsconfig.*)/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
};
