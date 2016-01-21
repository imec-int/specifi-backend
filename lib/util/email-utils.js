var _ = require('underscore')
    keystone = require('keystone'),
    i18n = require('i18next');

//Sends support a ticket bought email
exports.ticketBoughtSupportEmail = function(user, amount, experience,callback) {
    var options = {
        from: {
            name: i18n.t("APP_NAME"),
            email: process.env.NOREPLY_EMAIL
        },
        to: {
            name: process.env.APP_NAME,
            email: keystone.get('ticketsEmail')
        },
        subject: i18n.t("emails.TICKET_SOLD_EMAIL_SUBJECT"),
        username: user.username,
        amount: amount,
        experience: experience
    };

    new keystone.Email('ticket-support-email').send(options, callback);
};
