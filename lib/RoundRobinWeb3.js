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
/**
 * @file web3.js
 * @authors:
 *   Jeffrey Wilcke <jeff@ethdev.com>
 *   Marek Kotewicz <marek@ethdev.com>
 *   Marian Oancea <marian@ethdev.com>
 *   Fabian Vogelsteller <fabian@ethdev.com>
 *   Gav Wood <g@ethdev.com>
 * @date 2014
 */

var RequestManager = require('web3/lib/web3/requestmanager');
var Iban = require('web3/lib/web3/iban');
var Eth = require('web3/lib/web3/methods/eth');
var DB = require('web3/lib/web3/methods/db');
var Shh = require('web3/lib/web3/methods/shh');
var Net = require('web3/lib/web3/methods/net');
var Personal = require('web3/lib/web3/methods/personal');
var Swarm = require('web3/lib/web3/methods/swarm');
var Settings = require('web3/lib/web3/settings');
var version = require('web3/lib/version.json');
var utils = require('web3/lib/utils/utils');
var sha3 = require('web3/lib/utils/sha3');
var extend = require('web3/lib/web3/extend');
var Batch = require('web3/lib/web3/batch');
var Property = require('web3/lib/web3/property');
var RoundRobinHttpProvider = require('./RoundRobinHttpProvider');
var IpcProvider = require('web3/lib/web3/ipcprovider');
var BigNumber = require('bignumber.js');



function RoundRobinWeb3 (provider) {
    this._requestManager = new RequestManager(provider);
    this.currentProvider = provider;
    this.eth = new Eth(this);
    this.db = new DB(this);
    this.shh = new Shh(this);
    this.net = new Net(this);
    this.personal = new Personal(this);
    this.bzz = new Swarm(this);
    this.settings = new Settings();
    this.version = {
        api: version.version
    };
    this.providers = {
        RoundRobinHttpProvider: RoundRobinHttpProvider,
        IpcProvider: IpcProvider
    };
    this._extend = extend(this);
    this._extend({
        properties: properties()
    });
}

// expose providers on the class
RoundRobinWeb3.providers = {
    RoundRobinHttpProvider: RoundRobinHttpProvider,
    IpcProvider: IpcProvider
};

RoundRobinWeb3.prototype.setProvider = function (provider) {
    this._requestManager.setProvider(provider);
    this.currentProvider = provider;
};

RoundRobinWeb3.prototype.reset = function (keepIsSyncing) {
    this._requestManager.reset(keepIsSyncing);
    this.settings = new Settings();
};

RoundRobinWeb3.prototype.BigNumber = BigNumber;
RoundRobinWeb3.prototype.toHex = utils.toHex;
RoundRobinWeb3.prototype.toAscii = utils.toAscii;
RoundRobinWeb3.prototype.toUtf8 = utils.toUtf8;
RoundRobinWeb3.prototype.fromAscii = utils.fromAscii;
RoundRobinWeb3.prototype.fromUtf8 = utils.fromUtf8;
RoundRobinWeb3.prototype.toDecimal = utils.toDecimal;
RoundRobinWeb3.prototype.fromDecimal = utils.fromDecimal;
RoundRobinWeb3.prototype.toBigNumber = utils.toBigNumber;
RoundRobinWeb3.prototype.toWei = utils.toWei;
RoundRobinWeb3.prototype.fromWei = utils.fromWei;
RoundRobinWeb3.prototype.isAddress = utils.isAddress;
RoundRobinWeb3.prototype.isChecksumAddress = utils.isChecksumAddress;
RoundRobinWeb3.prototype.toChecksumAddress = utils.toChecksumAddress;
RoundRobinWeb3.prototype.isIBAN = utils.isIBAN;
RoundRobinWeb3.prototype.padLeft = utils.padLeft;
RoundRobinWeb3.prototype.padRight = utils.padRight;


RoundRobinWeb3.prototype.sha3 = function(string, options) {
    return '0x' + sha3(string, options);
};

/**
 * Transforms direct icap to address
 */
RoundRobinWeb3.prototype.fromICAP = function (icap) {
    var iban = new Iban(icap);
    return iban.address();
};

var properties = function () {
    return [
        new Property({
            name: 'version.node',
            getter: 'web3_clientVersion'
        }),
        new Property({
            name: 'version.network',
            getter: 'net_version',
            inputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'version.ethereum',
            getter: 'eth_protocolVersion',
            inputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'version.whisper',
            getter: 'shh_version',
            inputFormatter: utils.toDecimal
        })
    ];
};

RoundRobinWeb3.prototype.isConnected = function(){
    return (this.currentProvider && this.currentProvider.isConnected());
};

RoundRobinWeb3.prototype.createBatch = function () {
    return new Batch(this);
};

module.exports = RoundRobinWeb3;
