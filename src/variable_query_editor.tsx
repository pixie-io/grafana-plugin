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

import { SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import React, { useState } from 'react';
import { PixieVariableQuery } from './types';

interface VariableQueryProps {
  query: PixieVariableQuery;
  onChange: (query: PixieVariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange, query }) => {
  const [state, setState] = useState(query);

  const onClusterSelect = (option: SelectableValue<string>) => {
    if (option.label !== undefined) {
      console.log(option);
      setState({
        ...state,
        cluster: option.label,
      });
    }
  };

  const valueOptions = [{ label: 'Clusters' }];

  return (
    <>
      <div className="gf-form">
        <span className="gf-form-label width-10">Fetchable Data</span>
        <Select options={valueOptions} width={32} onChange={onClusterSelect} defaultValue={valueOptions[0]} />
      </div>
    </>
  );
};
