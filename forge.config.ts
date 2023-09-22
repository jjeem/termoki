const config = {
  packagerConfig: {
    // Do not include in the build src
    ignore: [
      /^\/src/,
      /^\/.vscode/,
      /^\/.github/,
      /(biome.json)|(.gitignore)|(vite.config.ts)|(forge.config.ts)|(tsconfig.*)/,
    ],
    icon: "./media/logo",
    appCopyright: "Copyright (c) 2023 Jad Alkheder",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        authors: "jeem",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      config: {
        authors: "jeem",
      },
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        authors: "jeem",
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        authors: "jeem",
      },
    },
  ],
};

module.exports = config;
