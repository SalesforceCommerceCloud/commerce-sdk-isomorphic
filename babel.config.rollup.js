const pkg = require('./package.json');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: pkg.browserslist.production,
      },
    ],
    '@babel/typescript',
    '@babel/preset-react',
  ],
  ignore: ['node_modules/**'],
};
