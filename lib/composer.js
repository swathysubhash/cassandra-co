'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _ = require('underskore');

// composes various parts of CQL statements, updating the params array along the way

module.exports = {
	select: _ref => {
		let count = _ref.count;
		let distinct = _ref.distinct;
		return 'select ' + (count ? 'count(*)' : distinct ? 'distinct ' + distinct.join(', ') : '*');
	},

	delete: columns => 'delete ' + columns.join(', '),

	insert: table => 'insert into ' + table,

	update: table => 'update ' + table,

	from: table => ' from ' + table,

	values: (data, params) => {
		let values = _.values(data);

		params.push.apply(params, _toConsumableArray(values));

		return ' (' + _.keys(data).join(', ') + ') values (' + Array(values.length).fill('?').join(', ') + ')';
	},

	set: (data, params) => params.push.apply(params, _toConsumableArray(_.values(data))) && ' set ' + _(data).map((value, key) => key + '=?').join(', '),

	increment: (column, by) => ' set ' + column + ' = ' + column + ' + ' + by,

	decrement: (column, by) => ' set ' + column + ' = ' + column + ' - ' + by,

	where: (criteria, params) => {

		let where = _(criteria).chain().omit(v => v === undefined).map((conditions, column) => {
			if (typeof conditions !== 'object') {
				params.push(conditions);
				return column + '=?';
			}

			return _(conditions).chain().omit(v => v === undefined).map((operand, operator) => {
				switch (operator) {
					case 'in':
						params.push.apply(params, _toConsumableArray(operand));
						return column + ' in (' + Array(operand.length).fill('?').join(', ') + ')';
					case 'contains':
						params.push(operand);
						return column + ' contains ?';
					case 'containsKey':
						params.push(operand);
						return column + ' contains key ?';
					default:
						params.push(operand);
						return column + operator + '?';
				}
			}).value().join(' and ');
		}).reject(_.isEmpty).value().join(' and ');

		return where ? ' where ' + where : '';
	},

	order: _ref2 => {
		let orderBy = _ref2.orderBy;
		return orderBy ? ' order by ' + (orderBy.desc || orderBy.asc || orderBy) + (orderBy.desc ? ' desc' : '') : '';
	},

	limit: (_ref3, params) => {
		let limit = _ref3.limit;
		return limit ? params.push(limit) && ' limit ?' : '';
	},

	using: (_ref4, params) => {
		let ttl = _ref4.ttl;
		let timestamp = _ref4.timestamp;

		let using = [];
		ttl && params.push(ttl) && using.push('ttl ?');
		timestamp && params.push(timestamp) && using.push('timestamp ?');
		return using.length ? ' using ' + using.join(' and ') : '';
	},

	filtering: clauses => clauses.allowFiltering ? ' allow filtering' : ''
};