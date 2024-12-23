# 使用官方 Node.js 镜像作为基础镜像, 使用较小的 alpine 版本
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 将 package.json 复制到工作目录
COPY ./package.json yarn.lock .

# 安装依赖
RUN npm install

# 将整个项目代码复制到镜像中
COPY . .

RUN npm run build

# 暴露应用的端口
EXPOSE 8080

# 启动应用
CMD ["node", "dist/app.js"]

