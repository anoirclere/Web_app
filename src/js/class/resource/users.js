module.exports = (function() {
	var query = require('./query.js');
	var utils = require('../utils.js');
	var users = {};
	var usernames = {};
	var self = {};
	self.set = function (uid, data) {
		users[uid] = data;
		usernames[data.username] = uid;
	};
	self.getLocal = function (uid) {
		return users[uid] || null;
	};
	self.get = function (value) {
		var deferred = $.Deferred();
		var uid;
		if (utils.isId(value)) {
			uid = value;
		} else if (utils.isValidUsername(value)) {
			uid = usernames[value] || null;
		} else {
			deferred.reject('Invalid username');
			return deferred.promise();
		}
		if (uid && users[uid]) {
			deferred.resolve(users[uid]);
		} else {
			query.getUser(value, function (result) {
				self.set(result.user.uid, result.user);
				deferred.resolve(result.user);
			}, function (msg) {
				deferred.reject(msg);
			});
		}
		return deferred.promise();
	};
	self.exists = function (uid) {
		return !!users[uid];
	};
	self.remove = function (uid) {
		if (users[uid]) {
			delete users[uid];
		}
	};
	return self;
})();