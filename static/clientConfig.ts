/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CommonParameters } from "./commonParameters";

/**
 *
 */
export class ClientConfig {
  public baseUri?: string;
  public proxy?: string;
  public headers?: { [key: string]: string };
  public parameters?: CommonParameters;
}
