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

const customQuery = require('./pxl_scripts/custom-query.json');
const exampleQuery = require('pxl_scripts/example-query.json');
const httpDataFiltered = require('pxl_scripts/http-data-filtered.json');
const httpErrorsPerService = require('pxl_scripts/http-errors-per-service.json');

interface Script {
  name: string;
  description: string;
  script: string;
}

// Load predefined scripts
const scriptsRaw: Script[] = [customQuery, exampleQuery, httpDataFiltered, httpErrorsPerService];

// Make a map for easier access of scripts
export const scripts: Map<string, Script> = new Map(scriptsRaw.map((script) => [script.name, script]));

// Construct options list which is injested by Select component in
export const scriptOptions = scriptsRaw.map((script: Script) => ({
  label: script.name,
  description: script.description,
}));
