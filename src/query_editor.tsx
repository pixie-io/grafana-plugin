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
import { Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-python';
import 'prism-themes/themes/prism-vsc-dark-plus.css';

import { DataSource } from './datasource';
import { scriptOptions } from 'pxl_scripts';
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
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryType: 'run-script', queryBody: { pxlScript: event } });
    onRunQuery();
  }

  onScriptSelect(option: SelectableValue<string>) {
    if (option.value !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, queryType: 'run-script', queryBody: { pxlScript: option.value } });
      onRunQuery();
    }
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const pxlScript = query?.queryBody?.pxlScript;

    return (
      <div className="gf-form" style={{ margin: '10px', display: 'block' }}>
        <Select
          options={scriptOptions}
          width={32}
          onChange={this.onScriptSelect.bind(this)}
          defaultValue={scriptOptions[0]}
        />
        <Editor
          value={pxlScript === undefined ? '' : pxlScript}
          onValueChange={this.onPxlScriptChange.bind(this)}
          highlight={(code) => {
            if (code !== undefined) {
              return highlight(code, languages.python, 'python');
            } else {
              return '';
            }
          }}
          padding={10}
          style={editorStyle}
        />
      </div>
    );
  }
}
