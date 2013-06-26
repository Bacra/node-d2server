D2Server
========

D2Server用nodejs编写完成，
项目包含众多功能组件，涵盖了 **EJS** 、 **AutoF5** 、 **Less** 、 **splice File** 、 **init Object** 、 **DataAPI** 、 **File Sync** 、 **Download Files** 、 **Web Hosting** 、 **Min Css** 、 **Min JS** 、 **Min Css Name** 等模块。
软件开发目的是为了方便前端同学更好地组织开发文件，快速调试页面。



## Run Server

	node serv.js

默认状态下，占用如下端口：

80: View Server 可浏览编译后文件

81: Info Server 各种杂七杂八的功能都放在这个Server下

82: Develop Server 开发使用的Server

83: Splice Server 调试使用的Server

相关端口配置，见[`conf.js`](./conf.js)




## Get Started

在server环境下，运行`init d2server`；
在系统host文件中，添加 '127.0.0.1 d2server.test.com'和'127.0.0.1 test.com'；
然后在浏览器中打开 http://d2server.test.com/index.html，
恭喜你，创建项目成功啦～～

聪明的你，打开'd2server/.source/AppConf.js'，是不是一下子明白了这个server环境的运行原理了呢

更多功能介绍及详细文档，见 https://github.com/Bacra/node-d2server/wiki




## License

D2Server is available under the terms of the [MIT License](./LICENSE.md).
