# 搭建 EFK 日志收集系统——从 Docker Compose 到 Elasticsearch 可视化

在现代应用开发中，日志管理和监控至关重要。EFK（Elasticsearch, Filebeat, Kibana）堆栈作为一种常见的日志收集和可视化方案，已广泛应用于生产环境中。今天，我们将通过一个简化的例子，介绍如何使用 Docker 和 EFK 堆栈搭建一个完整的日志收集系统。

### 项目结构

我们的项目结构如下：

```bash
server-efk
├── docker-compose.yml
├── express-server-logs
│   └── app.log
├── filebeat
│   ├── Dockerfile
│   └── filebeat.yml
└── server
    ├── Dockerfile
    ├── logs
    │   └── app.log
    ├── package.json
    ├── src
    │   ├── app.ts
    │   ├── controllers
    │   │   └── index.ts
    │   └── utils
    │       └── logger.ts
    ├── tsconfig.json
    └── yarn.lock
```

在这个项目结构中，我们有 `server` 目录（Node.js 应用）、`filebeat` 目录（日志收集配置）和 `express-server-logs` 目录（存放日志文件）。通过 Docker Compose，我们将这些组件整合在一起，使用 Elasticsearch 存储日志，使用 Kibana 展示日志。

### Docker Compose 配置

首先，我们配置 `docker-compose.yml` 文件来定义各个服务：

`docker-compose.yml` 代码如下：

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    build:
      context: ./filebeat
    container_name: filebeat
    command: filebeat -e --strict.perms=false
    volumes:
      - ./express-server-logs:/app/logs
    env_file:
      - .env
    depends_on:
      - elasticsearch
      - kibana

  server:
    build:
      context: ./server
    container_name: server
    ports:
      - "8080:8080"
    depends_on:
      - elasticsearch
    volumes:
      - ./express-server-logs:/app/logs
```

- **Elasticsearch**: 用于存储日志数据。
- **Kibana**: 用于可视化日志，支持通过浏览器查看日志。
- **Filebeat**: 日志收集器，负责将日志从 `express-server-logs` 目录发送到 Elasticsearch。
- **Server**: 一个简单的 Node.js 应用，模拟日志生成。

通过这个配置，Docker Compose 会同时启动这些服务，并使它们相互协作。

### Server 目录：Node.js 应用

`server` 目录下是一个简单的 Node.js 应用，负责生成日志并保存到文件中。以下是 `server/Dockerfile`：

```dockerfile
_# 使用官方 Node.js 镜像作为基础镜像, 使用较小的 alpine 版本_
FROM node:20-alpine

_# 设置工作目录_
WORKDIR /app

_# 将 package.json 复制到工作目录_
COPY ./package.json yarn.lock .

_# 安装依赖_
RUN npm install

_# 将整个项目代码复制到镜像中_
COPY . .

RUN npm run build

_# 暴露应用的端口_
EXPOSE 8080

_# 启动应用_
CMD ["node", "dist/app.js"]
```

- 使用 `node:20-alpine` 镜像作为基础镜像。
- 在容器中安装依赖并构建应用。
- 启动 Node.js 应用，监听 8080 端口。

在应用中，我们通过简单的代码模拟日志生成，将日志存储到 `express-server-logs/app.log` 文件。

### Filebeat 配置

Filebeat 是日志收集的关键组件。我们通过 `filebeat/Dockerfile` 配置文件来构建 Filebeat 镜像：

```dockerfile
FROM docker.elastic.co/beats/filebeat-oss:7.15.0

COPY ./filebeat.yml /usr/share/filebeat/filebeat.yml

USER root

RUN chown -R root /usr/share/filebeat/
RUN chmod -R go-w /usr/share/filebeat/
```

`filebeat.yml` 配置文件指定了 Filebeat 如何收集日志：

```yaml
name: express-server-filebeat
logging.metrics.enabled: false
xpack.security.enabled: false
xpack.monitoring.enabled: false
setup.ilm.enabled: false
setup.template.enabled: false

filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /app/logs/*.log
    fields:
      service: express-server
      test: 123
      app: express-app
      username: ${ELASTICSEARCH_USERNAME}
      log_type: "express-server"
    fields_under_root: true
    json:
      keys_under_root: true
      overwrite_keys: true
      message_key: "message"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "express-server"
```

- Filebeat 会监控 `/app/logs/*.log` 文件，采集日志并发送到 Elasticsearch。
- 我们定义了日志的字段，如 `service`, `app`, `log_type` 等，帮助在 Kibana 中更好地进行查询和可视化。
- `output.elasticsearch` 配置 Filebeat 将日志发送到 Elasticsearch。

1. 启动服务

在配置完成后，只需运行以下命令启动所有服务：

```bash
docker-compose up
```

此命令会构建并启动所有服务：

- **Elasticsearch** 启动后，会在 `localhost:9200` 提供数据存储服务。
- **Kibana** 启动后，通过 `localhost:5601` 提供可视化界面。
- **Filebeat** 会收集 Node.js 应用日志，并将其发送到 Elasticsearch。
- **Server** 会启动一个简单的 Node.js 应用，并生成日志文件。

1. 查看日志

启动完成后，访问 `http://localhost:5601` 进入 Kibana。在 Kibana 中，你可以通过创建索引模式来查看 Elasticsearch 中的日志数据。你可以按日期、日志类型等字段进行查询和过滤，直观地查看日志信息。

### 总结

通过这个简单的示例，你可以轻松地搭建一个基于 EFK 的日志收集和分析系统。通过 Docker Compose，服务的部署和管理变得异常简单，而 Elasticsearch 和 Kibana 的强大功能可以帮助你高效地管理和分析日志。这个方案适用于任何需要日志监控和可视化分析的 Node.js 应用。
