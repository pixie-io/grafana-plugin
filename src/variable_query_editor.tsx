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
import { Select, Input, Button } from '@grafana/ui';
import React, { useState } from 'react';

import { CLUSTER_VARIABLE_NAME, PixieVariableQuery, QueryType } from './types';
import './styles.css';

//Specifies what properties the VariableQueryEditor receives in constructor
interface VariableQueryProps {
  onChange: (query: PixieVariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ onChange }) => {
  const valueOptions: Array<SelectableValue<QueryType>> = [
    { label: 'Clusters', value: QueryType.GetClusters },
    { label: 'Pods', value: QueryType.GetPods },
    { label: 'Services', value: QueryType.GetServices },
    { label: 'Namespaces', value: QueryType.GetNamespaces },
    { label: 'Node', value: QueryType.GetNodes },
  ];

  let [currentValue, setCurrentValue] = useState(valueOptions[0]);
  let [clusterID, setClusterID] = useState(`\$${CLUSTER_VARIABLE_NAME}`);

  const onSubmit = () => {
    let query: PixieVariableQuery = { queryType: currentValue.value! };
    if (query.queryType !== 'get-clusters') {
      query.queryBody = { clusterID: clusterID };
    }
    onChange(query, currentValue.label!);
  };

  return (
    <>
      <div className="gf-form">
        <span className="gf-form-label width-10">Fetchable Data</span>
        <Select
          value={currentValue}
          options={valueOptions}
          width={32}
          onChange={(option) => {
            setCurrentValue(option);
          }}
          defaultValue={valueOptions[0]}
        />

        {currentValue.value !== 'get-clusters' && (
          <Input
            className="m-2"
            about="Cluster ID"
            width={32}
            marginWidth={5}
            value={clusterID}
            onChange={(e) => {
              setClusterID(e.currentTarget.value);
            }}
          />
        )}

        <Button className={currentValue.value === 'get-pods' ? '' : 'm-2'} onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </>
  );
};
