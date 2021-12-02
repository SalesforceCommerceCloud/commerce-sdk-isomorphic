/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const config = {
  proxy: 'https://localhost:3000',
  headers: {},
  parameters: {
    clientId: 'CLIENT_ID',
    organizationId: 'ORGANIZATION_ID',
    shortCode: 'SHORT_CODE',
    siteId: 'SITE_ID',
  },
};
export {config as default};
