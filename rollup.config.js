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
import {apiNames, commonDependencies} from './scripts/fileList.ts';

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
    tsconfig: {
      fileName: 'tsconfig.sdk.json',
      hook: resolvedConfig => ({...resolvedConfig, noEmit: false}),
    },
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

// Helper function to create output config for both ESM and CJS formats
const createOutputConfig = ({file, name, format}) => ({
  file,
  format,
  name,
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  exports: 'named',
});

// Helper function to create base config for subpath exports
const createSubpathConfig = ({input, outputFile, name, format}) => ({
  input,
  output: createOutputConfig({file: outputFile, name, format}),
  plugins: sharedPlugins,
  external: [], // Don't externalize any dependencies for subpath bundles, ensures logic is self contained
});

const cjsConfig = {
  input: 'src/lib/index.ts',
  output: createOutputConfig({
    file: process.env.REACT_APP_PKG_MAIN || pkg.main,
    name: 'CommerceSdk',
    format: 'umd',
  }),
  plugins: sharedPlugins,
};

const esmConfig = {
  input: 'src/lib/index.ts',
  output: createOutputConfig({
    file: process.env.REACT_APP_PKG_MODULE || pkg.module,
    name: 'CommerceSdk',
    format: 'es',
  }),
  plugins: sharedPlugins,
};

// Generate common dependencies files (both ESM and CJS)
const commonDependenciesConfig = commonDependencies.flatMap(dependency => [
  // ESM version
  createSubpathConfig({
    input: dependency.input,
    outputFile: dependency.file,
    name: 'CommerceSdkCommonDependencies',
    format: 'es',
  }),
  // CJS version
  createSubpathConfig({
    input: dependency.input,
    outputFile: dependency.file.replace('.js', '.cjs.js'),
    name: 'CommerceSdkCommonDependencies',
    format: 'cjs',
  }),
]);

// Generate individual API files (both ESM and CJS) so developers can import them individually
const apiConfigs = apiNames.flatMap(apiName => [
  // ESM version
  createSubpathConfig({
    input: `src/lib/${apiName}/index.ts`,
    outputFile: `lib/${apiName}.js`,
    name: `CommerceSdk${apiName}`,
    format: 'es',
  }),
  // CJS version
  createSubpathConfig({
    input: `src/lib/${apiName}/index.ts`,
    outputFile: `lib/${apiName}.cjs.js`,
    name: `CommerceSdk${apiName}`,
    format: 'cjs',
  }),
]);

export default [
  cjsConfig,
  esmConfig,
  ...commonDependenciesConfig,
  ...apiConfigs,
];
