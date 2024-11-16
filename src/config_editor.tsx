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

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { PixieDataSourceOptions, PixieSecureDataSourceOptions } from './types';

const { FormField, SecretFormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<PixieDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options?.secureJsonData,
        apiKey: event.target.value,
      },
    });
  };

  onClusterIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options?.secureJsonData,
        clusterId: event.target.value,
      },
    });
  };

  onCloudAddrChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options?.secureJsonData,
        cloudAddr: event.target.value,
      },
    });
  };

  onResetAPIKey = () => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };

  onResetClusterId = () => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        clusterId: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        clusterId: '',
      },
    });
  };

  onResetCloudAddr = () => {
    const { onOptionsChange, options } = this.props;

    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        cloudAddr: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        cloudAddr: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as PixieSecureDataSourceOptions;

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
              onChange={this.onAPIKeyChange}
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
              onChange={this.onClusterIdChange}
            />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              value={secureJsonData.cloudAddr || ''}
              label="Pixie Cloud address (if not using getcosmic.ai)"
              placeholder="getcosmic.ai:443"
              labelWidth={20}
              inputWidth={20}
              onReset={this.onResetCloudAddr}
              onChange={this.onCloudAddrChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
