var RoundRobinWeb3 = require('./lib/RoundRobinWeb3');

if (typeof window !== 'undefined' && typeof window.RoundRobinWeb3 === 'undefined') {
	window.RoundRobinWeb3 = RoundRobinWeb3;
}

module.exports = RoundRobinWeb3;
