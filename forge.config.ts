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
    executableName: "termoki"
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
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
    },
    {
      name: "@electron-forge/maker-rpm",
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'jjeem',
          name: 'termoki'
        },
        prerelease: true
      }
    }
  ]
};

module.exports = config;
