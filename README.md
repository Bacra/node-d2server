D2Server
========

D2Server用nodejs编写，为方便前端同学更好地组织开发文件，快速调试页面而开发的服务器环境。
使用D2Server完全可以替换Apache的开发环境（[了解如何组织动态数据](http://bacra.github.io/node-d2server/module.html#dataapi)），构建一个基于静态文件和测试数据的前端开发环境。



## Features

* 使用项目配置文件管理项目，项目信息简单明了
* 针对团队协作，可每人设置独立的项目配置文件，由D2Server来合并配置信息
* 项目下设置独立的开发目录，分离开发文件和导出文件
* 项目文件保存后，自动刷新浏览器，CSS文件的更新可实现动态加载新样式（兼容IE6）
* 项目中使用 **EJS** 模版引擎处理HTML代码
* 项目中使用 **LESS** 编译CSS文件，并针对[BEM命名](http://www.w3cplus.com/css/mindbemding-getting-your-head-round-bem-syntax.html)规则，进行优化
* 使用 **DataAPI** ，不改变生产环境下的数据源文件路径，快速模拟动态数据，并实现自动化的管理
* 配置项目`alias`配置参数，一键创建二级域名指向
* 一键导出项目生产环境的最终文件，JS使用 **gcc** 压缩，CSS使用 **yuicompressor** 压缩
* 配置项目`sync`配置参数，在导出项目文件的同时，实现JS、CSS等文件的同步
* 导出项目过程中，可以针对[符合规范的样式命名](http://bacra.github.io/node-d2server/module.html#mincssname)，提供样式命名的压缩
* 针对开发文件使用文件缓存队列机制，减少IO开销，Server更快响应请求
* 动态合并开发源文件，方便使用Fiddler等调试工具
* 可设置多个项目初始化文件配置方案，通过`init`命令快速创建项目



## Get Started

Checkout to: http://bacra.github.io/node-d2server/get-started.html




## ChangeLog

在[CHANGELOG.md](./CHANGELOG.md)文件中找到D2Server的更新说明，
也通过github下载对应[版本源码](https://github.com/Bacra/node-d2server/releases)



## TodoList
通过[TODO.md](./TODO.md)可以查看D2Server正在开发的新功能



## License

D2Server is available under the terms of the [MIT License](./LICENSE.md).
