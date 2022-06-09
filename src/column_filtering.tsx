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

//Splits the script into two parts: 1. Script up till display columns, 2. Script after displaying columns
function splitScript(script: string): string[] {
  const beforeDisplayCol = script.slice(0, script.indexOf('[['));
  const afterDisplayCol = script.slice(script.indexOf(']]'));

  return [beforeDisplayCol, afterDisplayCol];
}

function formatColumnName(columnName: string): string {
  return "'" + columnName + "'" + ',';
}

function allColumnScript(columnNames: Array<{ label: string; value: number }>): string {
  let script = '[[';

  for (let i = 0; i < columnNames.length; i++) {
    script += formatColumnName(columnNames[i].label);
  }
  return script;
}

export function makeFilteringScript(
  chosenOptions: SelectableValue<{}>,
  script: string,
  columnNames: Array<{ label: string; value: number }>
): string {
  //Splits the script into two parts: 1. Script up till display columns, 2. Script after displaying columns
  const [beforeDisplayCol, afterDisplayCol] = splitScript(script);
  let filteredColumnScript = allColumnScript(columnNames);

  //If a column is chosen to be filtered by the user, filteredColumnScript will be updated
  if (chosenOptions.length > 0) {
    //Dynamically builds the script by concatenating each option that was chosen
    filteredColumnScript = `[[`;

    for (let i = 0; i < chosenOptions.length; i++) {
      filteredColumnScript += formatColumnName(chosenOptions[i].label);
    }
  }

  //returns a string that concatenates a part of script before displaying columns, the part actually displaying columns and anything after
  return beforeDisplayCol + filteredColumnScript + afterDisplayCol;
}
