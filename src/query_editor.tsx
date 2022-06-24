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
import { Select, MultiSelect, Button, FieldArray, Form, HorizontalGroup, IconButton } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import './query_editor.css';
import { DataSource } from './datasource';
import { scriptOptions, Script } from 'pxl_scripts';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';
import { getGroupByOptions, aggFunctionOptions } from './groupby';

type Props = QueryEditorProps<DataSource, PixieDataQuery, PixieDataSourceOptions>;

const editorStyle = {
  fontFamily: 'Consolas, monaco, monospace',
  fontSize: 12,
  width: '100%',
  marginTop: '10px',
  minHeight: '500px',
  overflow: 'auto',
  backgroundColor: 'rgb(18, 18, 18)',
};

export class QueryEditor extends PureComponent<Props> {
  onPxlScriptChange(event: string) {
    const { onChange, query } = this.props;
    onChange({
      ...query,
      queryType: 'run-script' as const,
      queryBody: { pxlScript: event },
    });
  }

  onScriptSelect(option: SelectableValue<Script>) {
    if (option.value !== undefined && option.label !== undefined) {
      const { onChange, query, onRunQuery } = this.props;

      onChange({
        ...query,
        queryType: 'run-script' as const,
        queryBody: { pxlScript: option?.value.script ?? '' },
        queryMeta: {
          isColFiltering: option.value.isColFiltering || false,
          isGroupBy: option.value.isGroupBy || false,
          columnOptions: option.columnOptions,
          groupByColOptions: option.groupByColOptions,
          aggData: [],
        },
      });
      onRunQuery();
    }
  }

  onColSelect(chosenOptions: Array<SelectableValue<{}>>) {
    if (chosenOptions !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, queryMeta: { ...query.queryMeta, selectedColFilter: chosenOptions } });
      onRunQuery();
    }
  }

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
    const pxlScript = query?.queryBody?.pxlScript;

    return (
      <div className="gf-form" style={{ margin: '10px', display: 'block' }}>
        <div className="gf-form" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Select
            options={scriptOptions}
            width={32}
            onChange={this.onScriptSelect.bind(this)}
            defaultValue={scriptOptions[0]}
          />
          {query.queryMeta?.isColFiltering ? (
            <MultiSelect
              placeholder="Select Columns to Display"
              options={query.queryMeta.columnOptions}
              onChange={this.onColSelect.bind(this)}
              width={32}
              inputId="column-selection"
            />
          ) : (
            <></>
          )}
          {query.queryMeta?.isGroupBy ? (
            <>
              <MultiSelect
                placeholder="GroupBy Columns"
                options={getGroupByOptions(query.queryMeta.selectedColFilter!, query.queryMeta.groupByColOptions!)}
                onChange={this.onGroupBySelect.bind(this)}
                width={32}
              />

              <Form
                onSubmit={(values) => {
                  //values = { aggOptions: query.queryMeta?.aggData };
                }}
              >
                {({ control }) => (
                  <FieldArray control={control} name="aggregateOptions">
                    {({ fields, append, remove }) => (
                      <>
                        <div style={{ marginBottom: '1rem' }}>
                          {fields.map((field, index) => (
                            <HorizontalGroup key={field.id}>
                              <Select
                                key={index}
                                placeholder="Aggregate Column"
                                options={getGroupByOptions(
                                  query.queryMeta?.selectedColFilter!,
                                  query.queryMeta?.groupByColOptions!
                                )}
                                width={24}
                                onChange={(value: SelectableValue) => this.onAggColSelect.bind(this)(value, index)}
                              />{' '}
                              <Select
                                key={index}
                                placeholder="Aggregate Function"
                                options={aggFunctionOptions}
                                width={24}
                                onChange={(value: SelectableValue) => this.onAggFuncSelect.bind(this)(value, index)}
                              />{' '}
                              <IconButton
                                name="trash-alt"
                                size="md"
                                iconType="default"
                                onClick={() => {
                                  //remove(index);
                                  remove([index]);
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
                              append({});
                            }}
                          >
                            Add Aggregate Pair
                          </Button>
                        </div>
                      </>
                    )}
                  </FieldArray>
                )}
              </Form>
            </>
          ) : (
            <></>
          )}
          <Button
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              this.props.onRunQuery();
            }}
          >
            Run Script
          </Button>
        </div>

        <Editor
          value={pxlScript ?? ''}
          onValueChange={this.onPxlScriptChange.bind(this)}
          textareaId="code-area"
          highlight={(code) => {
            if (code !== undefined) {
              return highlight(code, languages.python, 'python')
                .split('\n')
                .map((line, i) => `<span class='editor-line-number'>${i + 1}</span>${line}`)
                .join('\n');
            } else {
              return '';
            }
          }}
          padding={10}
          style={editorStyle}
          className="code-editor"
        />
      </div>
    );
  }
}