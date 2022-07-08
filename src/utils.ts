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

import { VariableModel } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { CLUSTER_VARIABLE_NAME } from 'types';

/**
 * Return the value of the dashboard variable if present.
 */
export function getClusterId(): string | undefined {
  const dashboardVariables: VariableModel[] = getTemplateSrv().getVariables();

  // find cluster variable and convert it to any since the variable value field is not exposed
  const pixieClusterIdVariable = dashboardVariables.find((variable) => variable.name === CLUSTER_VARIABLE_NAME) as any;
  return pixieClusterIdVariable?.current?.value;
}

export function checkExhaustive(val: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(val)}`);
}
