var keystone = require('keystone'),
	async = require('async'),
	User = keystone.list('User');

var admins = [
	{ username: 'admin', email: 'john.doe@me.com', password: 'playground', name: { first: 'John', last: 'Doe' }, isAdmin: true }
];

function createAdmin(admin, done) {
	
	var newAdmin = new User.model(admin);
	
	newAdmin.save(function(err) {
		if (err) {
			console.error("Error adding admin " + admin.email + " to the database:");
			console.error(err);
		} else {
			console.log("Added admin " + admin.email + " to the database.");
		}
		done();
	});
	
}

exports = module.exports = function(done) {
	async.forEach(admins, createAdmin, done);
};
