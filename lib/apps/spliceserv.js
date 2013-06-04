var servUtil = require('../servutil.js');

module.exports = require('http').createServer(servUtil.getListenFunc(servUtil.cacheServer4splice));