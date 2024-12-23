/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import filesize from 'rollup-plugin-filesize';
import includePaths from 'rollup-plugin-includepaths';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import autoprefixer from 'autoprefixer';
import stylelint from 'rollup-plugin-stylelint';
import postcssPresetEnv from 'postcss-preset-env';
import {terser} from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const inputs = [
    "src/lib/clientConfig.ts",
    "src/lib/config.ts",
    "src/lib/helpers/customApi.ts",
    "src/lib/helpers/environment.ts",
    "src/lib/helpers/fetchHelper.ts",
    "src/lib/helpers/index.ts",
    "src/lib/helpers/slasHelper.ts",
    "src/lib/helpers/types.ts",
    "src/lib/index.ts",
    "src/lib/responseError.ts",
    "src/lib/shopperBaskets.ts",
    "src/lib/shopperContexts.ts",
    "src/lib/shopperCustomers.ts",
    "src/lib/shopperDiscoverySearch.ts",
    "src/lib/shopperExperience.ts",
    "src/lib/shopperGiftCertificates.ts",
    "src/lib/shopperLogin.ts",
    "src/lib/shopperOrders.ts",
    "src/lib/shopperProducts.ts",
    "src/lib/shopperPromotions.ts",
    "src/lib/shopperSearch.ts",
    "src/lib/shopperSeo.ts",
    "src/lib/shopperStores.ts",
    "src/lib/templateUrl.ts",
    "src/lib/version.ts",
]

const outputs = [
//   {
//     dir: 'temp/umd',
//     file: process.env.REACT_APP_PKG_MAIN || pkg.main,
//     format: 'umd',
//   },
  {
    dir: 'lib',
    file: process.env.REACT_APP_PKG_MODULE || pkg.module,
    format: 'es',
  },
];

const postcssPlugins = [
  postcssPresetEnv({
    browsers: pkg.browserslist.production,
    stage: 3,
  }),
  autoprefixer(),
];

const config = outputs.map(({dir, file, format}) => ({
//   input: 'src/lib/index.ts',
  input: inputs,
  output: {
    // file,
    dir,
    format,
    name: 'CommerceSdk',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    exports: 'named',
  },
  plugins: [
    peerDepsExternal(),
    includePaths({
      include: {},
      paths: ['src'],
      // crypto is a node built-in, but rollup doesn't seem to know that?
      external: ['crypto', ...Object.keys(pkg.dependencies)],
      extensions: ['.js', '.json', '.html'],
    }),
    stylelint({
      throwOnError: true,
    }),
    postcss({
      extract: process.env.REACT_APP_PKG_STYLE || pkg.style,
      inline: false,
      plugins: postcssPlugins,
    }),
    ts({
      transpiler: 'babel',
      // Setting noEmit directly in the tsconfig triggers a react testing bug so we override it here
      tsconfig: resolvedConfig => ({...resolvedConfig, noEmit: false}),
      exclude: 'node_modules/**',
    }),
    babel({
      extensions,
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    resolve({
      extensions,
      browser: true,
    }),
    commonjs(),
    terser(),
    filesize(),
  ],
  treeshake: {
    moduleSideEffects: false, // Ignore side effects
  },
}));

export default config;
