/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-console */
import path from 'path';
import fs from 'fs-extra';

/**
 * Recursively removes all files ending in '-internal.yaml' from a directory and its subdirectories
 * @param directoryPath - The path to the directory to process
 * @param depth - The depth of the directory to process, we limit the depth to 3 to avoid infinite recursion
 */
export default function removeInternalOas(
  directoryPath: string,
  depth = 0
): void {
  if (depth > 3) {
    console.warn(
      `Reached maximum depth (${depth}) for directory: ${directoryPath}`
    );
    return;
  }

  if (!fs.existsSync(directoryPath)) {
    console.warn(`Directory does not exist: ${directoryPath}`);
    return;
  }

  const items = fs.readdirSync(directoryPath);

  items.forEach(item => {
    const fullPath = path.join(directoryPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      removeInternalOas(fullPath, depth + 1);
    } else if (stat.isFile() && item.endsWith('-internal.yaml')) {
      // Remove internal files
      fs.removeSync(fullPath);
      console.log(`Removed internal file: ${fullPath}`);
    }
  });
}