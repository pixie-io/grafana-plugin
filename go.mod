module px.dev/grafana-plugin

go 1.16

require (
	github.com/grafana/grafana-plugin-sdk-go v0.92.0
	github.com/stretchr/testify v1.7.0
	px.dev/pxapi v0.0.0-20210424010607-a9fe8fb62c2a
)

replace (
	github.com/apache/thrift => github.com/apache/thrift v0.13.0
	github.com/aws/aws-sdk-go => github.com/aws/aws-sdk-go v1.34.2
	github.com/coreos/etcd => go.etcd.io/etcd/v3 v3.5.0-alpha.0
	github.com/dgrijalva/jwt-go => github.com/dgrijalva/jwt-go/v4 v4.0.0-preview1
	github.com/gogo/protobuf => github.com/gogo/protobuf v1.3.2
	github.com/gorilla/websocket => github.com/gorilla/websocket v1.4.1
	github.com/miekg/dns => github.com/miekg/dns v1.1.25
	github.com/nats-io/nats-server/v2 => github.com/nats-io/nats-server/v2 v2.2.2
	github.com/nats-io/nats.go => github.com/nats-io/nats.go v1.10.0
	github.com/spf13/cobra => github.com/spf13/cobra v1.1.3
	github.com/spf13/viper => github.com/spf13/viper v1.7.1
	golang.org/x/crypto => github.com/golang/crypto v0.0.0-20210322153248-0c34fe9e7dc2
	golang.org/x/text => github.com/golang/text v0.3.5
	gopkg.in/yaml.v2 => gopkg.in/yaml.v2 v2.4.0
)

exclude (
	github.com/nats-io/jwt v0.3.2
	github.com/nats-io/jwt v1.2.2
)
