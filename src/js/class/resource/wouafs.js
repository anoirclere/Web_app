module.exports = (function() {
	var query = require('./query.js');
	var wouafs = {};
	var self = {};
	self.set = function (id, data) {
		wouafs[id] = data;
	};
	self.getLocal = function (id) {
		return wouafs[id] || null;
	};
	self.get = function (id) {
		var deferred = $.Deferred();
		if (wouafs[id]) {
			deferred.resolve(wouafs[id]);
		} else {
			query.post(id, function (result) {
				self.set(result.wouaf.id, result.wouaf);
				deferred.resolve(result.wouaf);
			}, function (msg) {
				deferred.reject(msg);
			});
		}
		return deferred.promise();
	};
	self.exists = function (id) {
		return !!wouafs[id];
	};
	self.remove = function (id) {
		if (wouafs[id]) {
			delete wouafs[id];
		}
	};
	return self;
})();