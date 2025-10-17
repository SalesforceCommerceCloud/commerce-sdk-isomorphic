/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react';

export const MoveToolboxButton = ({
  title,
  onDragStart,
}: {
  title: string;
  onDragStart: (event: React.MouseEvent<HTMLButtonElement>) => void;
}): JSX.Element => (
  <button
    className="pd-design__frame__toolbox-button"
    title={title}
    type="button"
    onDragStart={onDragStart}>
    <svg
      className="pd-design__frame__move-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.9 11.7l-3.8-4.2c-.3-.3-.6 0-.6.4v2.7h-4.7c-.2 0-.4-.2-.4-.4V5.5h2.7c.5 0 .7-.4.4-.6l-4.1-3.8c-.2-.2-.5-.2-.7 0L7.6 4.9c-.3.3-.1.6.4.6h2.6v4.7c0 .2-.2.4-.4.4H5.5V7.9c0-.5-.4-.7-.6-.4l-3.8 4.1c-.2.2-.2.5 0 .7l3.8 4.1c.3.3.6.1.6-.4v-2.6h4.7c.2 0 .4.2.4.4v4.7H7.9c-.5 0-.7.4-.4.6l4.1 3.8c.2.2.5.2.7 0l4.1-3.8c.3-.3.1-.6-.4-.6h-2.6v-4.7c0-.2.2-.4.4-.4h4.7v2.7c0 .5.4.7.6.4l3.8-4.1c.2-.3.2-.5 0-.7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);
