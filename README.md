# Web3js With Round Robin Feature
# GUIDE
```
const web3 = new RoundRobinWeb3(
	new RoundRobinWeb3.providers.RoundRobinHttpProvider(
		fullnodeLists,
		requestTimeout,
		allowBlockRange,
		checkValidFullnodeTime
	)
);
```
- example :
```
const web3 = new RoundRobinWeb3(
	new RoundRobinWeb3.providers.RoundRobinHttpProvider(
		[ 'http://172.104.183.123:8545', 'http://139.162.4.206:8545' ],
		0,
		0,
		10000
	)
);

for (var i = 0; i < 100; i++) {
	console.log(web3.eth.getBlock('latest').number);
}
```
# Installation
```npm install https://github.com/nghianv-ibl/round-robin-web3.git#develop```
