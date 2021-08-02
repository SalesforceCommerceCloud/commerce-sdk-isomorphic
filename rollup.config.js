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
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import pkg from './package.json';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
];

const outputs = [
  {
    file: process.env.REACT_APP_PKG_MAIN || pkg.main,
    format: 'umd',
  },
  {
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

const config = outputs.map(({ file, format }) => ({
  input: 'src/lib/index.ts',
  output: {
    file,
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
      external: Object.keys(pkg.dependencies),
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
      tsconfig: (resolvedConfig) => ({ ...resolvedConfig, noEmit: false }),
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
}));

export default config;
