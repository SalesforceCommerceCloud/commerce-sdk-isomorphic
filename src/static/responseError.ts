/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Response as NodeResponse } from "node-fetch";

/**
 * Extends the Error class with the the error being a combination of status code
 * and text retrieved from the response.
 *
 * @class ResponseError
 * @extends Error
 */
export default class ResponseError extends Error {
  constructor(response: NodeResponse);
  constructor(response: Response);
  constructor(response: any) {
    if(response instanceof Response || response instanceof NodeResponse){
      super(`${response.status} ${response.statusText}`);
    }
  };
}
