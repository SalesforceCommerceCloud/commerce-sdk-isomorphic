module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          'node': 'current'
        }
      },
    ],
    '@babel/typescript',
  ],
  ignore: ['node_modules/**'],
};
