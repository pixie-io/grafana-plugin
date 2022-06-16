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
import { Select, MultiSelect, Button } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import './query_editor.css';

import { DataSource } from './datasource';
import { scriptOptions, Script } from 'pxl_scripts';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';

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
          isTabular: option.value.isTabular || false,
          columnOptions: option.columnOptions,
        },
      });
      onRunQuery();
    }
  }

  onFilterSelect(chosenOptions: Array<SelectableValue<{}>>) {
    if (chosenOptions !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, queryMeta: { ...query.queryMeta, selectedColumns: chosenOptions } });
      onRunQuery();
    }
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const pxlScript = query?.queryBody?.pxlScript;

    return (
      <div className="gf-form" style={{ margin: '10px', display: 'block' }}>
        <div className="gf-form" style={{ display: 'flex' }}>
          <Select
            options={scriptOptions}
            width={32}
            onChange={this.onScriptSelect.bind(this)}
            defaultValue={scriptOptions[0]}
          />

          {query.queryMeta && query.queryMeta.isTabular ? (
            <MultiSelect
              className="m-2"
              placeholder="Select columns to filter"
              options={query.queryMeta.columnOptions}
              onChange={this.onFilterSelect.bind(this)}
              width={32}
              inputId="column-selection"
            />
          ) : (
            <></>
          )}
          <Button
            className="m-2"
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
            console.log(e);
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
