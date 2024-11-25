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

import React, { PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceSecureJsonDataOption,
  updateDatasourcePluginResetOption,
} from '@grafana/data';
import { PixieDataSourceOptions, PixieSecureDataSourceOptions } from './types';

const { FormField, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PixieDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onResetAPIKey = () => {
    updateDatasourcePluginResetOption(this.props, 'apiKey');
  };

  onResetClusterId = () => {
    updateDatasourcePluginResetOption(this.props, 'clusterId');
  };

  render() {
    const { options } = this.props;
    const { secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as PixieSecureDataSourceOptions;
    const jsonData = (options.jsonData || {}) as PixieDataSourceOptions;

    return (
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.apiKey) as boolean}
              value={secureJsonData.apiKey || ''}
              label="Pixie API Key"
              placeholder="Pixie API Key"
              labelWidth={20}
              inputWidth={20}
              onReset={this.onResetAPIKey}
              onChange={onUpdateDatasourceSecureJsonDataOption(this.props, 'apiKey')}
            />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.clusterId) as boolean}
              value={secureJsonData.clusterId || ''}
              label="Default Cluster ID"
              placeholder="Default Cluster ID"
              labelWidth={20}
              inputWidth={20}
              onReset={this.onResetClusterId}
              onChange={onUpdateDatasourceSecureJsonDataOption(this.props, 'clusterId')}
            />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              value={jsonData.cloudAddr || ''}
              label="Pixie Cloud address (if not using getcosmic.ai)"
              placeholder="getcosmic.ai:443"
              labelWidth={20}
              inputWidth={20}
              onChange={onUpdateDatasourceJsonDataOption(this.props, 'cloudAddr')}
            />
          </div>
        </div>
      </div>
    );
  }
}
