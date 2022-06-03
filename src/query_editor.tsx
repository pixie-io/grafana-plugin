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

import React, { ChangeEvent, PureComponent } from 'react';
import { TextArea, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { scriptOptions } from 'pxl_scripts';
import { defaultQuery, PixieDataSourceOptions, PixieDataQuery } from './types';

type Props = QueryEditorProps<DataSource, PixieDataQuery, PixieDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onPxlScriptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, pxlScript: event.target.value });
    onRunQuery();
  }

  onScriptSelect(option: SelectableValue<string>) {
    if (option.value !== undefined) {
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, pxlScript: option.value });
      onRunQuery();
    }
  }

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { pxlScript } = query;

    return (
      <div className="gf-form">
        <Select options={scriptOptions} onChange={this.onScriptSelect.bind(this)} />
        <TextArea
          id="PxL Script"
          name="PxL Script"
          rows={20}
          width={4}
          value={pxlScript || ''}
          onChange={this.onPxlScriptChange.bind(this)}
          label="PxL Script"
        />
      </div>
    );
  }
}
