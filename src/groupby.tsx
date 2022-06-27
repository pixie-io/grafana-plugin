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
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import React, { PureComponent } from 'react';
import { DataSource } from './datasource';
import { Select, MultiSelect, Button, HorizontalGroup, IconButton } from '@grafana/ui';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';

type Props = QueryEditorProps<DataSource, PixieDataQuery, PixieDataSourceOptions>;

const aggFunctionOptions: Array<{ label: string; value: number }> = [
  { label: 'any', value: 0 },
  { label: 'count', value: 1 },
  { label: 'max', value: 2 },
  { label: 'mean', value: 3 },
  { label: 'min', value: 4 },
  { label: 'quantiles', value: 5 },
  { label: 'sum', value: 6 },
];

function getGroupByOptions(
  chosenColDispOptions: Array<SelectableValue<{}>>,
  groupByColOptions: Array<{ label: string; value: number }>
): Array<SelectableValue<{}>> {
  // If any display column options were chosen return those otherwise return all groupby options
  if (chosenColDispOptions?.length > 0) {
    return chosenColDispOptions;
  }
  return groupByColOptions;
}

export function getGroupByScript(
  chosenGroupByOptions: SelectableValue<{}>,
  chosenAggPairs: Array<{ aggColumn: string; aggFunction: string }>
): string {
  // Presetting script to display df before any groupby modification
  let script = 'px.display(df)';

  // Update script if the user selected an option to groupby
  if (chosenGroupByOptions.length > 0) {
    let columns: string = chosenGroupByOptions
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

function getAggSelectValue(name: string): { label: string; value: number } | undefined {
  if (name === '') {
    // Select value wasn't chosen so must display placeholder
    return undefined;
  } else {
    // Placeholder should not be displayed
    return { label: name, value: 0 };
  }
}

export class GroupbyComponents extends PureComponent<Props> {
  onGroupBySelect(chosenOptions: Array<SelectableValue<{}>>) {
    if (chosenOptions !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, queryMeta: { ...query.queryMeta, selectedColGroupby: chosenOptions } });
      onRunQuery();
    }
  }

  onAggColSelect(option: SelectableValue<{}>, index: number) {
    if (option.value !== undefined && option.label !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      let aggArray = query.queryMeta?.aggData!;
      aggArray[index].aggColumn = option.label;
      onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
      onRunQuery();
    }
  }

  onAggFuncSelect(option: SelectableValue<{}>, index: number) {
    if (option.value !== undefined && option.label !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      let aggArray = query.queryMeta?.aggData!;
      aggArray[index].aggFunction = option.label;
      onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
      onRunQuery();
    }
  }

  removeAggPair(index: number) {
    const { onChange, query, onRunQuery } = this.props;
    if (index < query.queryMeta?.aggData?.length!) {
      let aggArray = query.queryMeta?.aggData!;
      aggArray.splice(index, 1);
      onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
      onRunQuery();
    }
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);

    return (
      <>
        <MultiSelect
          placeholder="Groupby Columns"
          options={getGroupByOptions(query.queryMeta?.selectedColDisplay!, query.queryMeta?.groupByColOptions!)}
          onChange={this.onGroupBySelect.bind(this)}
          width={32}
        />
        <div style={{ marginBottom: '1rem' }}>
          {query.queryMeta?.aggData?.map((field, index, remove) => (
            <HorizontalGroup key={index}>
              <Select
                key={index}
                placeholder="Aggregate Column"
                value={getAggSelectValue(query.queryMeta?.aggData![index].aggColumn!)}
                options={getGroupByOptions(query.queryMeta?.selectedColDisplay!, query.queryMeta?.groupByColOptions!)}
                width={24}
                onChange={(value: SelectableValue) => this.onAggColSelect.bind(this)(value, index)}
              />
              <Select
                key={index}
                placeholder="Aggregate Function"
                value={getAggSelectValue(query.queryMeta?.aggData![index].aggFunction!)}
                options={aggFunctionOptions}
                width={24}
                onChange={(value: SelectableValue) => this.onAggFuncSelect.bind(this)(value, index)}
              />{' '}
              <IconButton
                name="trash-alt"
                size="md"
                iconType="default"
                onClick={() => {
                  this.removeAggPair(index);
                }}
              ></IconButton>
            </HorizontalGroup>
          ))}
          <Button
            style={{ marginRight: '1rem' }}
            onClick={() => {
              const { onChange, query } = this.props;
              let aggArray = query.queryMeta?.aggData!;
              aggArray.push({ aggColumn: '', aggFunction: '' });
              onChange({ ...query, queryMeta: { ...query.queryMeta, aggData: aggArray } });
            }}
          >
            Add Aggregate Pair
          </Button>
        </div>
      </>
    );
  }
}
