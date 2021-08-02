/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const pkg = require('./package.json');

module.exports = (api) => {
  const isTest = api.env('test');
  if (isTest) {
    return {
      plugins: ['@babel/plugin-proposal-class-properties'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
        '@babel/typescript',
      ],
      ignore: ['node_modules/**'],
    };
  }

  return {
    plugins: ['@babel/plugin-proposal-class-properties'],
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: 3,
          modules: false,
          targets: pkg.browserslist.production,
        },
      ],
      '@babel/typescript',
      '@babel/preset-react',
    ],
    ignore: ['node_modules/**'],
  };
};
