var servUtil = require('../servUtil.js');

module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer));