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

export const aggFunctionOptions: Array<{ label: string; value: number }> = [
  { label: 'any', value: 0 },
  { label: 'count', value: 1 },
  { label: 'max', value: 2 },
  { label: 'mean', value: 3 },
  { label: 'min', value: 4 },
  { label: 'quantiles', value: 5 },
  { label: 'sum', value: 6 },
];

export function getGroupByOptions(
  chosenColFilterOps: Array<SelectableValue<{}>>,
  groupByColOptions: Array<{ label: string; value: number }>
): Array<SelectableValue<{}>> {
  // If any display column options were chosen return those otherwise return all groupby options
  if (chosenColFilterOps?.length > 0) {
    return chosenColFilterOps;
  }
  return groupByColOptions;
}

export function getGroupByScript(
  chosenOptions: SelectableValue<{}>,
  chosenAggPairs: Array<{ aggColumn: string; aggFunction: string }>
): string {
  // Presetting script to display df before any groupby modification
  let script = 'px.display(df)';

  // Update script if the user selected an option to groupby
  if (chosenOptions.length > 0) {
    let columns: string = chosenOptions
      .map((columnName: { label: string; value: number }) => `'${columnName.label}'`)
      .join();
    script = `df = df.groupby([` + columns + `])`;
    let aggScript = '.agg()\npx.display(df)';

    // Update aggScript if the user chose any aggregate options
    if (chosenAggPairs.length > 0) {
      let aggPairs: string = chosenAggPairs
        .map(
          (aggPair: { aggColumn: string; aggFunction: string }) =>
            `${aggPair.aggColumn}_${aggPair.aggFunction}=('${aggPair.aggColumn}',px.${aggPair.aggFunction})`
        )
        .join();
      aggScript = '.agg(' + aggPairs + ')\npx.display(df)';
    }
    script += aggScript;
  }
  return script;
}

export function getAggValues(name: string): { label: string; value: number } | undefined {
  if (name === '') {
    // Select value wasn't chosen so must display placeholder
    return undefined;
  } else {
    // Placeholder should not be displayed
    return { label: name, value: 0 };
  }
}
