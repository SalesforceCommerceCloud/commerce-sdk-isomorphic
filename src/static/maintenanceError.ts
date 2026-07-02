/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Error thrown when the sfdc_maintenance header is detected in a response
 * and throwOnMaintenanceHeader is enabled in client configuration.
 *
 * @class MaintenanceError
 * @extends Error
 */
export default class MaintenanceError extends Error {
  public readonly response: Response | import('node-fetch').Response;

  public readonly maintenanceType: 'system' | 'site';

  public readonly status = 503;

  constructor(
    response: Response | import('node-fetch').Response,
    maintenanceType: 'system' | 'site'
  ) {
    super(`Service unavailable due to ${maintenanceType} maintenance`);
    this.name = 'MaintenanceError';
    this.response = response;
    this.maintenanceType = maintenanceType;
  }
}
