# nodejs-cas

NodeJS轻量实现的CAS Client，支持接入CAS 2.0+的服务。

从https://github.com/acemetrix/connect-cas优化修改而来。

## 安装

    npm install nodejs-cas
            
## 使用

```javascript
var express = require('express');
var cas = require('nodejs-cas');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var MemoryStore = require('session-memory-store')(session);

var app = express();

app.use(cookieParser());
app.use(session({
  name: 'NSESSIONID',
  secret: 'Hello I am a long long long secret',
  store: new MemoryStore()  // or other session store
}));

/**
 *   cas config
 */
cas.configure({
  host: casServerHost,
  hostname: casServiceHostname,
  protocol: casServiceProtocal,
  port: casServicePort,
  paths: {
    validate: '/cas/validate',
    serviceValidate: '/cas/serviceValidate',
    proxy: '/cas/proxy',
    login: '/cas/login',
    logout: '/cas/logout'
  }
});

app.use(cas.serviceValidate({
  // 如果不是代理模型，不可以设置这个pgtUrl
  pgtUrl: '/cas/proxyCallback'
}))
  .use(cas.ssout('/cas/validate'))  // 如果不需要启用单点登出，不要使用该中间件
  .use(cas.authenticate());

app.get('/logout', function (req, res) {
  if (!req.session) {
    return res.redirect('/');
  }

  req.session.destroy();

  var options = cas.configure();
  options.pathname = options.paths.logout;
  options.query = {
    service: config.servicePrefix
  };
  return res.redirect(url.format(options));
});
```

## cas.configure支持配置

基本是参考Node自带URL模块的方式：

  - `procotol` CAS服务的协议。 默认：'https'。
  - `host` CAS服务的服务名。
  - `port` CAS服务的端口号。 默认：443。
  - `gateway` CAS gateway地址。默认：false.
  - `paths`
    - `validate` CAS Client接收校验请求的地址。默认： /cas/validate。
                 既登录时传递给Cas Server的service字段的后缀，登录时传递字段如： service=http://your.client.host/cas/validate
    - `serviceValidate` Cas server校验登陆st的路径。默认：/cas/serviceValidate
    - `proxy` proxy模型下，向Cas Server要访问其他service的pt的路径。默认： /cas/proxy
    - `login` 向Cas Server登录的路径。默认： /cas/login
    - `logout` 向Cas Server登出的路径。默认： /cas/logout

## 代理（proxy）模型

代理模型下，在调用cas.serviceValidate中间件时，必须设置pgtUrl参数，中间件在登录后校验st时，传递pgtUrl给serviceValidate所设置的校验地址。

```javascript
app.use(cas.serviceValidate({
  // 代理模型下，必须设置pgtUrl
  pgtUrl: '/cas/proxyCallback'
}))
```

## 代理（proxy）模型下，获取pgt（proxy-granting ticket）

调用cas.proxyTicket中间件，会自动向cas server索要pgt，获得pgt后会将其附在req.pt上并传递给下面的中间件。

如：

```javascript

// 为所有请求都索要pgt
app.use(cas.proxyTicket({
  targetService: serviceYouNeedToAccess // 需要访问的服务的validate路径，如: http://some/server/shiro-cas
}))

// 仅为特定路由索要pgt
router.route('/jobs/:jobId')
  .all(cas.proxyTicket({
     targetService: serviceYouNeedToAccess
   }))
  .get(function (req, res) {
    // 通过req.pt拿到pgt，然后将其附在下游服务的请求地址后，如：xxxx?ticket=req.pt
    // do your bussinuess then

    res.send(result);
  });
```

#### 一个完整的示例请访问/example， 配置config.json，并执行`node index.js`。

## 注意
1. 对于Https的一些实现细节并未实现，目前仅支持http请求。
2. 使用session时必须使用sessionStore，如果仅想在内存中实现session，推荐使用配套的session store实现`session-memory-store`。

## License

  MIT
