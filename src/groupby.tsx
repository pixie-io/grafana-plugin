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
import { Select, MultiSelect, Button, HorizontalGroup, IconButton, InlineLabel } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';
import { DataSource } from './datasource';

type Props = QueryEditorProps<DataSource, PixieDataQuery, PixieDataSourceOptions>;

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
  chosenColDisplayOps: Array<SelectableValue<number>>,
  groupByColOptions: Array<SelectableValue<number>>
): Array<SelectableValue<number>> {
  // If any display column options were chosen return those otherwise return all groupby options
  if (chosenColDisplayOps?.length > 0) {
    return chosenColDisplayOps;
  }
  return groupByColOptions;
}

export function getGroupByScript(
  chosenOptions: Array<SelectableValue<number>>,
  chosenAggPairs: Array<SelectableValue<number>>
): string {
  // Exit function if no groupby options were chosen
  if (!chosenOptions.length) {
    return 'px.display(df)';
  }

  // Make the groupby script with the column options chosen and add agg options if chosen
  const columns = chosenOptions.map(({ label }) => `'${label}'`);
  const script = `df = df.groupby([${columns.join(',')}])`;
  const aggPairs = chosenAggPairs.map(
    ({ aggColumn, aggFunction }) => `${aggColumn}_${aggFunction}=('${aggColumn}', px.${aggFunction})`
  );

  return `${script}.agg(${aggPairs.join(', ')})\npx.display(df)`;
}

export function getAggValues(name: string): { label: string; value: number } | null {
  // If a select value wasn't chosen display the placeholder otherwise don't display placeholder
  if (name === '') {
    return null;
  }
  return { label: name, value: 0 };
}

export class GroupbyComponents extends PureComponent<Props> {
  onGroupBySelect(chosenOptions: Array<SelectableValue<number>>): void {
    if (!chosenOptions) {
      return;
    }
    const { onChange, query, onRunQuery } = this.props;

    let aggArray = query.queryMeta?.aggData!;
    if (chosenOptions.length === 0) {
      aggArray = [];
    }
    onChange({ ...query, queryMeta: { ...query.queryMeta, selectedColGroupby: chosenOptions, aggData: aggArray } });
    onRunQuery();
  }

  onAggColSelect(option: SelectableValue<number>, index: number): void {
    const { onChange, query, onRunQuery } = this.props;
    if (option.value === undefined || option.label === undefined || !query.queryMeta?.aggData) {
      return;
    }

    const aggArray = query.queryMeta.aggData;
    aggArray[index].aggColumn = option.label;
    onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
    onRunQuery();
  }

  onAggFuncSelect(option: SelectableValue<number>, index: number): void {
    const { onChange, query, onRunQuery } = this.props;
    if (option.value === undefined || option.label === undefined || !query.queryMeta?.aggData) {
      return;
    }

    const aggArray = query.queryMeta.aggData;
    aggArray[index].aggFunction = option.label;
    onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
    onRunQuery();
  }

  removeAggPair(index: number): void {
    const { onChange, query, onRunQuery } = this.props;
    if (index >= query.queryMeta?.aggData?.length! || !query.queryMeta?.aggData) {
      return;
    }

    const aggArray = query.queryMeta.aggData;
    aggArray.splice(index, 1);
    onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
    onRunQuery();
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <>
        <div style={{ marginLeft: '10px', marginTop: '10px', display: 'flex' }}>
          <InlineLabel transparent={false} width="auto">
            Groupby Columns
          </InlineLabel>
          <MultiSelect
            placeholder="Groupby Columns"
            options={getGroupByOptions(query.queryMeta?.selectedColDisplay!, query.queryMeta?.groupByColOptions!)}
            onChange={this.onGroupBySelect.bind(this)}
            closeMenuOnSelect={false}
            width={34}
          />
        </div>
        <div style={{ marginTop: '10px', marginLeft: '10px' }}>
          {query.queryMeta?.selectedColGroupby && query.queryMeta?.selectedColGroupby?.length !== 0 && (
            <>
              <div style={{ display: 'row' }}>
                {query.queryMeta?.aggData?.map((field, index, remove) => (
                  <HorizontalGroup key={index}>
                    <div style={{ marginBottom: '8px' }}>
                      <Select
                        key={index}
                        placeholder="Aggregate Column"
                        value={getAggValues(query.queryMeta?.aggData![index].aggColumn!)}
                        options={getGroupByOptions(
                          query.queryMeta?.selectedColDisplay!,
                          query.queryMeta?.groupByColOptions!
                        )}
                        width={28}
                        onChange={(value: SelectableValue) => this.onAggColSelect.bind(this)(value, index)}
                      />
                    </div>
                    <div style={{ marginLeft: '3px', marginBottom: '8px' }}>
                      <Select
                        key={index}
                        placeholder="Aggregate Function"
                        value={getAggValues(query.queryMeta?.aggData![index].aggFunction!)}
                        options={aggFunctionOptions}
                        width={24}
                        onChange={(value: SelectableValue) => this.onAggFuncSelect.bind(this)(value, index)}
                      />
                    </div>
                    <div style={{ marginLeft: '3px', marginBottom: '8px' }}>
                      <IconButton
                        name="trash-alt"
                        size="md"
                        iconType="default"
                        onClick={() => {
                          this.removeAggPair(index);
                        }}
                      ></IconButton>
                    </div>
                  </HorizontalGroup>
                ))}
              </div>

              <Button
                style={{ float: 'right', marginRight: '31px' }}
                onClick={() => {
                  const { onChange, query } = this.props;
                  let aggArray = query.queryMeta?.aggData!;
                  aggArray.push({ aggColumn: '', aggFunction: '' });
                  onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
                }}
              >
                Add Aggregate Pair
              </Button>
            </>
          )}
        </div>
      </>
    );
  }
}
