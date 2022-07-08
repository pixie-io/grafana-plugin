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
import { Select, MultiSelect, Button, InlineLabel } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import './styles.css';
import { DataSource } from './datasource';
import { scriptOptions, Script } from './pxl_scripts';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery, QueryType } from './types';
import { GroupbyComponents } from './groupby';

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
      queryType: QueryType.RunScript,
      queryBody: { pxlScript: event },
    });
  }

  onScriptSelect(option: SelectableValue<Script>) {
    if (option.value !== undefined && option.label !== undefined) {
      const { onChange, query, onRunQuery } = this.props;

      onChange({
        ...query,
        queryType: QueryType.RunScript,
        queryScript: option ?? null,
        queryBody: { pxlScript: option?.value.script ?? '' },
        queryMeta: {
          isColDisplay: option.value.isColDisplay || false,
          isGroupBy: option.value.isGroupBy || false,
          columnOptions: option.columnOptions,
          groupByColOptions: option.groupByColOptions,
          selectedColDisplay: [] || null,
          selectedColGroupby: [] || null,
          aggData: [],
        },
      });

      onRunQuery();
    }
  }

  onColSelect(chosenOptions: Array<SelectableValue<number>>) {
    if (chosenOptions !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, queryMeta: { ...query.queryMeta, selectedColDisplay: chosenOptions } });
      onRunQuery();
    }
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { onChange, onRunQuery } = this.props;
    const pxlScript = query?.queryBody?.pxlScript;

    return (
      <div className="gf-form" style={{ margin: '10px', display: 'block' }}>
        <div className="gf-form">
          <div style={{ marginTop: '10px', marginRight: '10px', display: 'flex' }}>
            <InlineLabel transparent={false} width="auto">
              Script
            </InlineLabel>
            <Select
              options={scriptOptions}
              width={32}
              onChange={this.onScriptSelect.bind(this)}
              defaultValue={query.queryScript ?? scriptOptions[0]}
            />
          </div>

          <div style={{ margin: '10px', display: 'flex' }}>
            {query.queryMeta?.isColDisplay && (
              <>
                <InlineLabel transparent={false} width="auto">
                  Columns Displayed
                </InlineLabel>
                <MultiSelect
                  placeholder="Select Columns to Display"
                  options={query.queryMeta.columnOptions}
                  onChange={this.onColSelect.bind(this)}
                  closeMenuOnSelect={false}
                  width={32}
                  inputId="column-selection"
                  value={query.queryMeta.selectedColDisplay ?? undefined}
                />
              </>
            )}
          </div>

          {query.queryMeta?.isGroupBy && (
            <GroupbyComponents
              datasource={this.props.datasource}
              query={query}
              onRunQuery={onRunQuery}
              onChange={onChange}
            />
          )}
          <Button
            style={{ marginLeft: 'auto', marginTop: '10px' }}
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
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              const { onRunQuery } = this.props;
              onRunQuery();
              e.preventDefault();
            }
          }}
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
