D2Server
========

D2Server用nodejs编写，为方便前端同学更好地组织开发文件，快速调试页面而开发的服务器环境。
使用D2Server完全可以替换Apache的开发环境（[了解如何组织动态数据](http://bacra.github.io/node-d2server/dataAPI.html)），构建一个基于静态文件和测试数据的前端开发环境。



## Features

* 使用项目配置文件管理项目，项目信息简单明了
* 针对团队协作，可每人设置独立的项目配置文件，由D2Server来合并配置信息
* 项目下设置独立的开发目录，分离开发文件和导出文件
* 项目文件保存后，自动刷新浏览器，CSS文件的更新可实现动态加载新样式（兼容IE6）
* 项目中使用 **EJS** 模版引擎处理HTML代码
* 项目中使用 **LESS** 编译CSS文件，并针对[BEM命名](http://www.w3cplus.com/css/mindbemding-getting-your-head-round-bem-syntax.html)规则，进行优化
* 使用 **DataAPI** ，不改变生产环境下的数据源文件路径，快速模拟动态数据，并实现自动化的管理
* 一键导出项目生产环境的最终文件，JS使用 **gcc** 压缩，CSS使用 **yuicompressor** 压缩
* 导出项目过程中，可以针对[符合规范的样式命名](http://bacra.github.io/node-d2server/MinCssName.html)，提供样式命名的压缩
* 动态合并开发源文件，方便使用Fiddler等调试工具
* 可设置多个项目初始化文件配置方案，通过`init`命令快速创建项目



## Run Server

	node serv.js

了解更多：http://bacra.github.io/node-d2server




## ChangeLog & TodoList

你可以在[CHANGELOG.md](./CHANGELOG.md)中找到D2Server的更新状况

同时，我们也会在[TODO.md](./TODO.md)中公布D2Server的开发进度



## License

D2Server is available under the terms of the [MIT License](./LICENSE.md).
