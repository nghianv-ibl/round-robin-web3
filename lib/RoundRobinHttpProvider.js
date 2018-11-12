/*
    This file is part of web3.js.
    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file httpprovider.js
 * @authors:
 *   Marek Kotewicz <marek@ethdev.com>
 *   Marian Oancea <marian@ethdev.com>
 *   Fabian Vogelsteller <fabian@ethdev.com>
 * @date 2015
 */


var errors = require('web3/lib/web3/errors');
var _ = require('lodash');
var LoadBalance = require('loadbalance');

// workaround to use httpprovider in different envs

// browser
if (typeof window !== 'undefined' && window.XMLHttpRequest) {
	XMLHttpRequest = window.XMLHttpRequest; // jshint ignore: line
	// node
} else {
	XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest; // jshint ignore: line
}

var XHR2 = require('xhr2'); // jshint ignore: line

/**
 * HttpProvider should be used to send rpc calls over http
 */
var RoundRobinHttpProvider = function (hosts, timeout, allowBlockRange, checkValidFullnodeTime) {
	this.hosts = hosts || ['http://localhost:8545'];
	this.host = null;
	this.engine = null;
	this.valids = [];
	this.timeout = timeout || 0;
	this.allowBlockRange = allowBlockRange || 0;
	this.checkValidFullnode();
	setInterval(() => {
		this.checkValidFullnode();
	}, checkValidFullnodeTime || 60000);
};

/**
 * Should be called to prepare new XMLHttpRequest
 *
 * @method prepareRequest
 * @param {Boolean} true if request should be async
 * @return {XMLHttpRequest} object
 */
RoundRobinHttpProvider.prototype.prepareRequest = function (async) {
	this.host = this.engine.pick();

	var request;

	if (async) {
		request = new XHR2();
		request.timeout = this.timeout;
	} else {
		request = new XMLHttpRequest();
	}

	request.open('POST', this.host, async);
	request.setRequestHeader('Content-Type', 'application/json');
	return request;
};

/**
 * Should be called to make sync request
 *
 * @method send
 * @param {Object} payload
 * @return {Object} result
 */
RoundRobinHttpProvider.prototype.send = function (payload) {
	var seft = this;
	var request = seft.prepareRequest(false);

	try {
		request.send(JSON.stringify(payload));
	} catch (error) {
		if (seft.valids.length > 1) {
			seft.valids = seft.valids.filter(host => host !== seft.host);
			seft.engine = LoadBalance.roundRobin(seft.valids);
			return seft.send(payload);
		} else {
			throw errors.InvalidConnection(seft.host);
		}
	}

	var result = request.responseText;

	try {
		result = JSON.parse(result);
	} catch (e) {
		throw errors.InvalidResponse(request.responseText);
	}

	return result;
};

/**
 * Should be used to make async request
 *
 * @method sendAsync
 * @param {Object} payload
 * @param {Function} callback triggered on end with (err, result)
 */
RoundRobinHttpProvider.prototype.sendAsync = function (payload, callback) {
	var seft = this;
	var request = seft.prepareRequest(true);

	request.onreadystatechange = function () {
		if (request.readyState === 4 && request.timeout !== 1) {
			var result = request.responseText;
			var error = null;

			try {
				result = JSON.parse(result);
			} catch (e) {
				if (seft.valids.length > 1) {
					seft.valids = seft.valids.filter(host => host !== seft.host);
					seft.engine = LoadBalance.roundRobin(seft.valids);
					return seft.sendAsync(payload, callback);
				} else {
					error = errors.InvalidResponse(request.responseText);
				}
			}

			callback(error, result);
		}
	};

	request.ontimeout = function () {
		callback(errors.ConnectionTimeout(seft.timeout));
	};

	try {
		request.send(JSON.stringify(payload));
	} catch (error) {
		callback(errors.InvalidConnection(seft.host));
	}
};

/**
 * Synchronously tries to make Http request
 *
 * @method isConnected
 * @return {Boolean} returns true if request haven't failed. Otherwise false
 */
RoundRobinHttpProvider.prototype.isConnected = function () {
	try {
		this.send({
			id: 9999999999,
			jsonrpc: '2.0',
			method: 'net_listening',
			params: []
		});
		return true;
	} catch (e) {
		return false;
	}
};

RoundRobinHttpProvider.prototype.prepareCheckingFullnodeRequest = function (async, host, timeout) {
	var request;

	if (async) {
		request = new XHR2();
		request.timeout = timeout;
	} else {
		request = new XMLHttpRequest();
	}

	request.open('POST', host, async);
	request.setRequestHeader('Content-Type', 'application/json');
	return request;
};

RoundRobinHttpProvider.prototype.sendCheckingFullnode = function (payload, host, timeout) {
	var request = this.prepareCheckingFullnodeRequest(false, host, timeout);

	try {
		request.send(JSON.stringify(payload));
	} catch (error) {
		throw errors.InvalidConnection(host);
	}

	var result = request.responseText;

	try {
		result = JSON.parse(result);
	} catch (e) {
		throw errors.InvalidResponse(request.responseText);
	}

	return result;
};

RoundRobinHttpProvider.prototype.isConnectedFullnode = function (host) {
	try {
		this.sendCheckingFullnode({
			id: 9999999999,
			jsonrpc: '2.0',
			method: 'net_listening',
			params: []
		}, host, this.timeout);
		return true;
	} catch (e) {
		return false;
	}
}

RoundRobinHttpProvider.prototype.getFullnodeBlockNumber = function (host) {
	try {
		var result = this.sendCheckingFullnode({
			id: 9999999999,
			jsonrpc: '2.0',
			method: 'eth_blockNumber',
			params: []
		}, host);
		return parseInt(result.result);
	} catch (e) {
		return 0;
	}
}

RoundRobinHttpProvider.prototype.checkValidFullnode = function () {
	const infos = {};
	this.hosts.forEach((host) => {
		if (this.isConnectedFullnode(host)) {
			// console.log('Fullnode ' + host + ' alive');
			infos[host] = this.getFullnodeBlockNumber(host);
		}
	});
	const maxBlockNumber = _.max(Object.keys(infos).map(host => infos[host]));
	const validHosts = Object.keys(infos).map((host) => {
		if (maxBlockNumber - infos[host] <= this.allowBlockRange) {
			// console.log('Fullnode ' + host + ' is valid with block number ' + infos[host]);
			return host;
		}
	});
	if (_.difference(validHosts, this.valids).length > 0) {
		console.log('Fullnode list changed');
		this.valids = validHosts;
		this.engine = LoadBalance.roundRobin(this.valids);
		console.log('Fullnode list', this.valids);
	}
}

module.exports = RoundRobinHttpProvider;
