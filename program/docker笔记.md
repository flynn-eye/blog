---

title: docker笔记

meta:
  - name: description
    content: docker笔记
  - name: keywords
    content: docker

created: 2021/09/12

updated: 2021/09/12
---

---

### docker笔记

- docker image ls 列出所有镜像
- docker search redis  搜redis版本
- docker image pull redis 
- docker image rmi redis 按照名字或者id删除镜像
- docker image prune 删除未被引用的image
- docker image tag redis rds 给镜像重命名
- docker login 登录
- docker container -iteadPv -p 80:80 nginx // i交互式 t命令行  v挂载宿主机分区到容器 p发布端口到容器 e设置环境变量 P publish-all d后台运行 a附加到运行容器
- docker ps // 查看容器 -l最近的  -a所有
- docker stats 资源使用情况
- docker top containerID // 资源使用情况
- docker kill containerID // 关闭某个容器 直接退出比较暴力
- docker port 查看container端口映射情况
- docker ps 容器运行情况
- docker stop containerID // 关闭容器 发送关闭信号  会保存状态 处理请求
- docker log containerID // 容器输出
- docker start containerID // 启动容器
- docker exec -i /bin/sh //进入操作界面
- docker commit -a author -m "test" containerID myImageName 上传一个docker镜像
- docker inspect redis // 显示redis image的详情
- docker history redis // 显示一个镜像的历史详情
- docker save redis // 导出image为tar
- docker load redis // 导入tar为image
- docker export -o name containerID 导出容器为tar
- docker import tar 导入 tar为 容器
- docker volume
- docker network
