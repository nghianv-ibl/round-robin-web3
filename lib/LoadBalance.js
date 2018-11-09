var AbstractEngine = module.exports.AbstractEngine = require('./AbstractEngine.js')
var RandomEngine = module.exports.RandomEngine = require('./RandomEngine.js')
var WeightedRandomEngine = module.exports.WeightedRandomEngine = require('./WeightedRandomEngine.js')
var RoundRobinEngine = module.exports.RoundRobinEngine = require('./RoundRobinEngine.js')
var WeightedRoundRobinEngine = module.exports.WeightedRoundRobinEngine = require('./WeightedRoundRobinEngine.js')

module.exports.roundRobin = function(pool) {
	if (pool.length === 0) {
		throw new Error('pool length must be greater than zero')
	}

	var entry = pool[0]

	if (entry.weight) {
		return new WeightedRoundRobinEngine(pool)
	} else {
		return new RoundRobinEngine(pool)
	}
}

module.exports.random = function(pool, seed) {
	if (pool.length === 0) {
		throw new Error('pool length must be greater than zero')
	}

	var entry = pool[0]

	if (entry.weight) {
		return new WeightedRandomEngine(pool, seed)
	} else {
		return new RandomEngine(pool, seed)
	}
}

module.exports.isEngine = function (engine) {
	return engine instanceof AbstractEngine
}
