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

export const scripts: { [script: string]: string } = {
  'scratch-pad': '',
  example: String.raw`
# Import Pixie's module for querying data.
import px
# Load data from Pixie's \`http_events\` table into a Dataframe.
df = px.DataFrame(table='http_events', start_time=__time_from)
# Add K8s metadata context.
df.service = df.ctx['service']
df.namespace = df.ctx['namespace']
# Bin the 'time_' column using the interval provided by Grafana.
df.timestamp = px.bin(df.time_, __interval)
# Group data by unique pairings of 'timestamp' and 'service'
# and count the total number of requests per unique pairing.
per_ns_df = df.groupby(['timestamp', 'service']).agg(
        throughput_total=('latency', px.count)
    )
# Calculate throughput by dividing # of requests by the time interval.
per_ns_df.request_throughput = per_ns_df.throughput_total / __interval
per_ns_df.request_throughput = per_ns_df.request_throughput * 1e9
# Rename 'timestamp' column to 'time_'. The Grafana plugin expects a 'time_'
# column to display data in a Graph or Time series.
per_ns_df.time_ = per_ns_df.timestamp
# Output select columns of the DataFrame.
px.display(per_ns_df['time_', 'service', 'request_throughput'])
`,

  'http-data-filtered': String.raw`# Copyright 2018- The Pixie Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

'''
This query outputs a table of HTTP events (request and response pairs).
It produces output identical to Pixie's \`px/http_data_filtered\` script in the Live UI.

To filter the HTTP events, uncomment lines 41-43. Alternatively, use Grafana's
table column filtering feature:
https://grafana.com/docs/grafana/latest/visualizations/table/filter-table-columns/

This query is for use with Grafana's Pixie Datasource Plugin only,
as it uses Grafana macros for adding Grafana dashboard context.
'''

# Import Pixie's module for querying data.
import px

# Import HTTP events table.
df = px.DataFrame(table='http_events', start_time=__time_from)

# Add columns for service, pod info.
df.svc = df.ctx['service']
df.pod = df.ctx['pod']
df = df.drop('upid')

# EXAMPLE OPTIONAL FILTERS
#df = df[px.contains(df.svc, 'catalogue')]
#df = df[px.contains(df.pod, 'catalogue')]
#df = df[df.req_path == '/healthz']

# Avoid conversion to long format
df.timestamp = df.time_
df = df.drop(columns=['time_'])

# Keep only the selected columns (and order them in the following order)
df = df[['timestamp', 'remote_addr', 'remote_port', 'req_method', 'req_path', 'resp_status', 'resp_body', 'latency', 'svc', 'pod']]

# Output the DataFrame
px.display(df)
`,
  'http-errors-per-service': String.raw`
# Copyright 2018- The Pixie Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

'''
This query outputs a table of HTTP error and total request count per service.

This query is for use with Grafana's Pixie Datasource Plugin only,
as it uses Grafana macros for adding Grafana dashboard context.
'''

# Import Pixie's module for querying data.
import px

# Import HTTP events table.
df = px.DataFrame(table='http_events', start_time=__time_from)

# Add columns for service, namespace info.
df.namespace = df.ctx['namespace']
df.service = df.ctx['service']

# Filter out requests that don't have a service defined.
df = df[df.service != '']

# Filter out requests from the Pixie (pl) namespace.
df = df[df.namespace != 'pl']

# Add column for HTTP response status errors.
df.error = df.resp_status >= 400

# Group HTTP events by service, counting errors and total HTTP events.
df = df.groupby(['service']).agg(
    error_count=('error', px.sum),
    total_requests=('resp_status', px.count)
)

# Output the DataFrame.
px.display(df)
`,
};

export const options = [
  { label: 'scratch-pad' },
  { label: 'example' },
  { label: 'http-data-filtered' },
  { label: 'http-errors-per-service' },
];
