/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type CompositeParameters<MethodParameters extends object, ConfigParameters extends object> =
    & Omit<MethodParameters, keyof ConfigParameters>
    & Partial<MethodParameters>

export type RequireParametersUnlessAllAreOptional<T extends { parameters?: object }> =
    {} extends NonNullable<T['parameters']> ? T : T & Required<Pick<T, 'parameters'>>;
