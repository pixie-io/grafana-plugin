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

import defaults from 'lodash/defaults';
import React, { PureComponent } from 'react';
import { MultiSelect, InlineLabel, Tooltip } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';
import { DataSource } from './datasource';

type Props = QueryEditorProps<DataSource, PixieDataQuery, PixieDataSourceOptions>;

export function getColumnsScript(
  chosenOptions: Array<SelectableValue<number>>,
  allColumnOptions: Array<SelectableValue<number>>
): string {
  // Setting script default to all the columns in the script
  let script = allColumnOptions.map(({ label }) => `'${label}'`).join();

  // Updating the script if the user selected columns to filter
  if (chosenOptions?.length > 0) {
    script = chosenOptions.map(({ label }) => `'${label}'`).join();
  }

  return script;
}

export class ColDisplayComponents extends PureComponent<Props> {
  onColSelect(chosenOptions: Array<SelectableValue<number>>) {
    if (chosenOptions === undefined) {
      return;
    }
    const { onChange, query, onRunQuery } = this.props;

    // Finds which column was removed between the old and new cols selected
    const oldCols = query.queryMeta?.selectedColDisplay?.map(({ label }) => label)!;
    const chosenCols = chosenOptions.map(({ label }) => label);
    const colToRemove = oldCols.filter((c) => !chosenCols.includes(c))[0];

    // Update Groupby Array with correct columns to display
    const groupByArr = query.queryMeta?.selectedColGroupby?.filter(({ label }) => {
      return label !== colToRemove;
    });

    // Update Aggregate Array with correct columns to display
    const aggArr = query.queryMeta?.aggData?.filter(({ aggColumn }) => {
      return aggColumn !== colToRemove;
    });
    const aggData = groupByArr?.length ? aggArr ?? [] : [];

    onChange({
      ...query,
      queryMeta: {
        ...query.queryMeta,
        selectedColDisplay: chosenOptions,
        selectedColGroupby: groupByArr,
        aggData: aggData,
      },
    });

    onRunQuery();
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <div style={{ margin: '10px', display: 'flex' }}>
        {query.queryMeta?.isColDisplay && (
          <>
            <InlineLabel transparent={false} width="auto">
              Columns Displayed
            </InlineLabel>

            <Tooltip content={'Cannot remove options selected in groupby/aggregate'} theme={'info'}>
              <MultiSelect
                placeholder="Select Columns to Display"
                options={query.queryMeta.columnOptions}
                onChange={this.onColSelect.bind(this)}
                closeMenuOnSelect={false}
                width={32}
                isClearable={true}
                inputId="column-selection"
                value={query.queryMeta.selectedColDisplay ?? undefined}
              />
            </Tooltip>
          </>
        )}
      </div>
    );
  }
}
