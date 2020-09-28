/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from "path";
import fs from "fs-extra";
import { updateApis } from "./scripts/utils";

const API_NAMES = [
  "shopper-baskets",
  "shopper-customers",
  "shopper-discovery-query",
  "shopper-gift-certificates",
  "shopper-login",
  "shopper-orders",
  "shopper-products",
  "shopper-promotions",
  "shopper-search",
  "shopper-stores"
];

const PRODUCTION_API_PATH = path.join(__dirname, "apis");

// DOWNLOAD PRODUCTION DATA
fs.remove(PRODUCTION_API_PATH);
fs.ensureDirSync(PRODUCTION_API_PATH);

API_NAMES.map((name) =>
  updateApis(name, /production/i, PRODUCTION_API_PATH)
);