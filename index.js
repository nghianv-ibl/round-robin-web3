var RoundRobinWeb3 = require('./lib/RoundRobinWeb3');

if (typeof window !== 'undefined' && typeof window.RoundRobinWeb3 === 'undefined') {
	window.RoundRobinWeb3 = RoundRobinWeb3;
}

// module.exports = RoundRobinWeb3;

const web3 = new RoundRobinWeb3(
	new RoundRobinWeb3.providers.RoundRobinHttpProvider(
		[ 'http://172.104.183.123:8545', 'http://139.162.4.206:8545' ],
		0,
		0,
		10000
	)
);

for (var i = 0; i < 20; i++) {
	console.log(web3.eth.getBlock('latest').number);
}
