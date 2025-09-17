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
// this file is generated when the `yarn build:lib` script is run
// eslint-disable-next-line import/extensions
import { apiNames, commonDependencies } from './scripts/fileList.ts';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const postcssPlugins = [
  postcssPresetEnv({
    browsers: pkg.browserslist.production,
    stage: 3,
  }),
  autoprefixer(),
];

// TODO: reduce bundle size by modifying shared plugins to remove unecessary polyfills
// W-19605045
const sharedPlugins = [
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
];

const cjsConfig = {
  input: 'src/lib/index.ts',
  output: {
    file: process.env.REACT_APP_PKG_MAIN || pkg.main,
    format: 'umd',
    name: 'CommerceSdk',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    exports: 'named',
  },
  plugins: sharedPlugins,
};

const esmConfig = {
  input: 'src/lib/index.ts',
  output: {
    file: process.env.REACT_APP_PKG_MODULE || pkg.module,
    // dir: 'lib',
    format: 'es',
    name: 'CommerceSdk',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    exports: 'named',
  },
  plugins: sharedPlugins,
};


const commonDependenciesConfig = commonDependencies.map(dependency => ({
  input: dependency.input,
  output: {
    file: dependency.file,
    format: 'es',
    name: 'CommerceSdkCommonDependencies', // TODO: potentially make this dynamic
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    exports: 'named',
  },
  plugins: sharedPlugins,
  external: [], // Don't externalize any dependencies for common dependencies bundle, ensures logic is self contained
}));

// Generate individual API configurations
const apiConfigs = apiNames.map(apiName => ({
  input: `src/lib/${apiName}/index.ts`,
  output: {
    file: `lib/${apiName}.js`,
    format: 'es',
    name: `CommerceSdk${apiName.charAt(0).toUpperCase() + apiName.slice(1)}`,
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    exports: 'named',
  },
  plugins: sharedPlugins,
  // Don't externalize any dependencies for individual API bundles, 
  // ensures all logic is self contained within the API bundle and can run without any external dependencies
  external: [],
}));

export default [cjsConfig, esmConfig, ...commonDependenciesConfig, ...apiConfigs];

