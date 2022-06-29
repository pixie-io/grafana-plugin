/*
 * Copyright 2018- The Pixie Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { SelectableValue } from '@grafana/data';

export function getColumnsScript(
  chosenOptions: SelectableValue<{ label: string; value: number }>,
  allColumnOptions: Array<SelectableValue<{ label: string; value: number }>>
): string {
  // Setting script default to all the columns in the script
  let script = allColumnOptions.map((columnName) => `'${columnName.label}'`).join();

  // Updating the script if the user selected columns to filter
  if (chosenOptions && chosenOptions.length > 0) {
    script = chosenOptions.map((columnName: { label: string; value: number }) => `'${columnName.label}'`).join();
  }

  return script;
}
