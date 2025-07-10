module.exports = {
  packagerConfig: {
    ignore: [
      /\.gitignore/,
      /\.vscode/,
      /__pycache__/,
      /LICENSE/,
      /README\.md/,
      /debug\.txt/,
      /package-lock\.json/,
      /requirements\.txt/,
      /Arcaea_Difficulty_Lookup\/(crawler|backend)\.py/
    ],
    platform: 'win32',  // 针对Windows平台打包
    arch: 'x64',       // 64位架构
    extraResource: [   // 显式包含必要资源
    ]
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'QTYXOVO',
          name: 'Electron-ArcaeaToolkit'
        },
        prerelease: false,
        draft: false
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'arcaeatoolkit',
        setupExe: 'ArcaeaToolkit-Setup.exe',
        //iconUrl: 'path/to/icon.ico'  // 可选：添加应用图标
      }
    }
  ]
};