'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.hastingsToCoins = exports.coinsToHastings = exports.call = exports.isRunning = exports.launch = exports.connect = exports.errCouldNotConnect = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

// isRunning returns true if a successful call can be to /gateway
// using the address provided in `address`.  Note that this call does not check
// whether the rivined process is still running, it only checks if a Rivine API is
// reachable.
var _isRunning = function () {
	var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(address) {
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.prev = 0;
						_context.next = 3;
						return _call(address, '/gateway');

					case 3:
						return _context.abrupt('return', true);

					case 6:
						_context.prev = 6;
						_context.t0 = _context['catch'](0);
						return _context.abrupt('return', false);

					case 9:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this, [[0, 6]]);
	}));

	return function _isRunning(_x) {
		return _ref.apply(this, arguments);
	};
}();

// rivinedWrapper returns an instance of a Rivined API configured with address.


// connect connects to a running Rivined at `address` and returns a rivinedWrapper object.
var connect = function () {
	var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(address) {
		var running;
		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						_context2.next = 2;
						return _isRunning(address);

					case 2:
						running = _context2.sent;

						if (running) {
							_context2.next = 5;
							break;
						}

						throw errCouldNotConnect;

					case 5:
						return _context2.abrupt('return', rivinedWrapper(address));

					case 6:
					case 'end':
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function connect(_x2) {
		return _ref2.apply(this, arguments);
	};
}();

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _child_process = require('child_process');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// rivine.js error constants
var errCouldNotConnect = exports.errCouldNotConnect = new Error('could not connect to the Rivine daemon');

// Coin -> hastings unit conversion functions
// These make conversion between units of Rivine easy and consistent for developers.
// Never return exponentials from BigNumber.toString, since they confuse the API
// rivine.js: a lightweight node wrapper for starting, and communicating with
// a Rivine daemon (rivined).
_bignumber2.default.config({ EXPONENTIAL_AT: 1e+9 });
_bignumber2.default.config({ DECIMAL_PLACES: 30 });

var hastingsPerCoin = new _bignumber2.default('10').toPower(24);
var coinsToHastings = function coinsToHastings(coins) {
	return new _bignumber2.default(coins).times(hastingsPerCoin);
};
var hastingsToCoins = function hastingsToCoins(hastings) {
	return new _bignumber2.default(hastings).dividedBy(hastingsPerCoin);
};

// Call makes a call to the Rivine API at `address`, with the request options defined by `opts`.
// returns a promise which resolves with the response if the request completes successfully
// and rejects with the error if the request fails.
var _call = function _call(address, opts) {
	return new _promise2.default(function (resolve, reject) {
		var callOptions = opts;
		if (typeof opts === 'string') {
			callOptions = { url: opts };
		}
		callOptions.url = 'http://' + address + callOptions.url;
		callOptions.json = true;
		callOptions.headers = {
			'User-Agent': 'Rivine-Agent'
		};

		(0, _request2.default)(callOptions, function (err, res, body) {
			if (!err && (res.statusCode < 200 || res.statusCode > 299)) {
				reject(body);
			} else if (!err) {
				resolve(body);
			} else {
				reject(err);
			}
		});
	});
};

// launch launches a new instance of rivined using the flags defined by `settings`.
// this function can `throw`, callers should catch errors.
// callers should also handle the lifecycle of the spawned process.
/*
var launch = function launch(path, settings) {
	var defaultSettings = {
		'api-addr': 'localhost:9980',
		'host-addr': ':9982',
		'rpc-addr': ':9981',
		'authenticate-api': false,
		'disable-api-security': false,
		'modules': 'cghmrtw'
	};
*/
// Modify for rivine daemon
var launch = function launch(path,  settings) {
	var defaultSettings = {
		'api-addr': 'localhost:23110',
		'host-addr': ':23112',
		'rpc-addr': ':23111',
		'authenticate-api': false,
		'disable-api-security': false,
		'modules': 'cghmrtw'
	};
	var mergedSettings = (0, _assign2.default)(defaultSettings, settings);
	var filterFlags = function filterFlags(key) {
		return mergedSettings[key] !== false;
	};
	var mapFlags = function mapFlags(key) {
		return '--' + key + '=' + mergedSettings[key];
	};
	var flags = (0, _keys2.default)(mergedSettings).filter(filterFlags).map(mapFlags);

	var opts = {};
	if (process.geteuid) {
		opts.uid = process.geteuid();
	}
	return (0, _child_process.spawn)(path, flags, opts);
};var rivinedWrapper = function rivinedWrapper(address) {
	var rivinedAddress = address;
	return {
		call: function call(options) {
			return _call(rivinedAddress, options);
		},
		isRunning: function isRunning() {
			return _isRunning(rivinedAddress);
		}
	};
};exports.connect = connect;
exports.launch = launch;
exports.isRunning = _isRunning;
exports.call = _call;
exports.coinsToHastings = coinsToHastings;
exports.hastingsToCoins = hastingsToCoins;
