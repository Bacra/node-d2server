var servUtil = require('../module/servUtil/servUtil.js');

module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer));