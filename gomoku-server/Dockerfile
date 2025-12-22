# 使用轻量级 Node 环境
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制 package.json 安装依赖 (利用缓存层加速)
COPY package.json ./
RUN npm install

# 复制源代码
COPY index.js ./

# 暴露端口 (必须与 index.js 里的 PORT 一致)
EXPOSE 3000

# 启动命令
CMD ["node", "index.js"]