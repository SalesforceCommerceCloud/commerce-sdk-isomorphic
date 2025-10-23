/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export const DeleteToolboxButton = ({
  title,
  onClick,
}: {
  title: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}): JSX.Element => (
  <button
    className="pd-design__frame__toolbox-button"
    title={title}
    type="button"
    onClick={onClick}>
    <svg
      className="pd-design__frame__delete-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);
