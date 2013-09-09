各个版本源码下载地址：
https://github.com/Bacra/node-d2server/releases



# v3.2.4

* 完善页面内弹窗样式，兼容更加复杂的页面样式环境
* 页面内弹窗增加`Splice`的连接地址
* 修正页面内弹窗的连接地址，自动根据当前访问地址判断是否使用`alias`
* View页面也增加页面内弹窗
* 修正某些状况下View Server无法获取项目信息的问题
* 在`ejs`的HTML参数中，保留`sys`的`block`设置，同时也增加`blockReg`的正则表达式

### Fix

* 修正项目配置文件中`HTML`最里层配置（单个HTML文件的配置项目）不能复用的问题




# v3.2.3

* 修正HTML中内嵌css、js导致`MinCssName`压缩错误的问题
* 优化`MinCssName`，有效提高`export`导出效率
* 修改`ejs`模块的安装，直接通过`npm`
* 将ejs的源码直接放入D2Server中，不再使用git子库进行引用
* 使用node-mime开源项目代替mime.js




## v3.2.2

* MinCssName对id也将进行缩减转化
* ejs页面增加`sys`变量， **之前的`title` `extJS` `extCSS`变量都转到`sys`下**
* ejs页面变量`sys`增加`catalog` `href` `srcFile` `outFile`等实用变量值
* ejs页面增加`root`变量，是ejs页面变量的顶层，所有变量都依附于他

### Fix

* 修正开发环境下，页面js占用`module`变量导致`socket.io`初始化失败的问题
* 修正项目配置文件`HTML`属性合并规则，判断条件统一为导出目录是否一致
* 修正MinCssName配置方案的key对应相同值时，转化结果出现重复值的问题
* 修正`HTML`配置方案中`data`数据为共用变量时，造成的Server处理结果变量混乱的状况





## v3.2.1

* 修正第二次修改项目的配置文件时，提示`alias`或则`hostname`存在的问题
* 修正DataAPI返回数据mime信息错误的问题
* 当`wget`数据请求失败时，DataAPI也会创建相应的数据文件



## v3.2.0

* 针对fileMap中的文件，追加`sync`同步机制
* 项目配置文件增加`catalog`参数，简化项目相对于域名的内嵌目录
* D2Server `conf.js`中增加EJS开始和结束标签的定义
* 增加缓存中单个文件最大体积的判断，大文件不进行缓存
* 强制`include`的HTML file不能作为入口被直接访问
* 更加智能的项目配置合并规则（`fileMap`和`HTML`配置，只要文件解析后路径相同，配置属性就会自动合并）

### Fix

* 修正`fileMap`中定义文件，路径不再依据HTML中的访问路径，而是以项目根目录为基准
* 修正无法转化使用EJS动态添加的资源路径（css less js），例如使用`extJS`、`extCss`以及使用变量拼出来的路径




## v3.1.3

* 修正不使用`alias`后，无法获取Project信息的问题
* 修正spliceServer在合并非js css资源时，直接输出第一个文件的问题




## v3.1.2

* 修正MainProjConf定义的sync参数无效的问题
* 修正项目配置文件编译错误时，必须重启server才能获取下一次更新内容的问题




## v3.1.1

* 修正目录存在时，初始化项目，无法自动导入到server中的错误
* 修正MainProjConf文件HTML配置未被正确解析的错误




## v3.1.0

* 新的dataAPI接口方法，设置动态数据更简单，附加自动Cache功能
* 不重启server，直接读取外部转入的项目
* 重新设置`header`和`footer`的配置方案，解决多个配置文件之间设置默认值时存在的不和谐的冲突；同时再提供一层默认值的设置方案（可直接在`HTML`子元素中，设置`header`和`footer`），原先的`defaultHeader`和`defaultFooter`作为跨配置文件的设置存在




## v3.0.2

* 更新项目文件及目录，引入mod加载模式
* 优化公共资源调用，将404 favicon等资源部署到所有server
* 针对nodemon进行项目配置优化，设置忽略列表




## v3.0.1

* 配置文件分离，由主配置文件可以衍生出多个子配置文件，方便团队协作开发
* 增加404页面
* 完善d2fs，增加项目页面切换的浮动窗
* 完善convertCss方法，优化实现队列
* 优化MinCssName参数，可实现前缀与key一一对应的配置
* 增加项目初始化cmd，提供可选择的初始化文件解决方案
* 优化EJS模版引擎




## v3.0.0

* 基于nodejs开发，环境更加容易部署维护
* nodejs提供高并发，浏览器访问和项目导出的速度都有显著提升
* 使用JS进行文件内容缓存，更少的IO操作，更快相应请求
* 服务端解析Less文件，缓解浏览器UI线程压力
* 基于extJS的页面拓展，解决浏览器兼容问题（原先是以浏览器插件的形式注入）
* 基于EJS的模版引擎，放弃PHPTAL模式，为后期兼容其他模版引擎做铺垫
* MinCssName，快速压缩类名
* 优化Less parser，优化BEM的类名生成
* 优化项目配置文件，结构更加清晰
* 放弃使用页面参数，HTML亦可导出
