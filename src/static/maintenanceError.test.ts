/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Response} from 'node-fetch';
import MaintenanceError from './maintenanceError';

describe('MaintenanceError', () => {
  test('creates error with system maintenance type', () => {
    const response = new Response('{}', {
      status: 200,
      headers: {sfdc_maintenance: 'system'},
    });

    const error = new MaintenanceError(response, 'system');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MaintenanceError);
    expect(error.name).toBe('MaintenanceError');
    expect(error.message).toBe('Service unavailable due to system maintenance');
    expect(error.status).toBe(503);
    expect(error.maintenanceType).toBe('system');
    expect(error.response).toBe(response);
  });

  test('creates error with site maintenance type', () => {
    const response = new Response('{}', {
      status: 200,
      headers: {sfdc_maintenance: 'site'},
    });

    const error = new MaintenanceError(response, 'site');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MaintenanceError);
    expect(error.name).toBe('MaintenanceError');
    expect(error.message).toBe('Service unavailable due to site maintenance');
    expect(error.status).toBe(503);
    expect(error.maintenanceType).toBe('site');
    expect(error.response).toBe(response);
  });

  test('error can be caught and properties accessed', () => {
    const response = new Response('{}', {status: 200});
    const error = new MaintenanceError(response, 'system');

    try {
      throw error;
    } catch (caught) {
      expect(caught).toBeInstanceOf(MaintenanceError);
      if (caught instanceof MaintenanceError) {
        expect(caught.status).toBe(503);
        expect(caught.maintenanceType).toBe('system');
        expect(caught.response).toBe(response);
      }
    }
  });

  test('error has correct property types', () => {
    const response = new Response('{}', {status: 200});
    const error = new MaintenanceError(response, 'system');

    expect(error.status).toBe(503);
    expect(typeof error.status).toBe('number');
    expect(error.maintenanceType).toBe('system');
    expect(['system', 'site']).toContain(error.maintenanceType);
  });
});
