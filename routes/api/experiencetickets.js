var _ = require('underscore'),
    keystone = require('keystone'),
    async = require('async'),
    moment = require('moment'),
    i18n = require('i18next');
var Experience = keystone.list('Experience');
var ExperienceTicket = keystone.list('ExperienceTicket');

/*
 * Get a specific ExperienceTicket
 * */
exports.get = function(req, res) {
    ExperienceTicket.model.findOne({_id: req.params.id, user: req.user.id}).populate('experience user').exec(function(err, ticket){
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!ticket) return res.apiError('1088', i18n.t('1088'));
        ticket.getMediaHavenUrls(function(ticket) {
            return res.apiResponse({ticket: ticket});
        });
    });
}

/*
 * Gets a list of ExperienceTickets
 * */
exports.list = function(req, res) {
    ExperienceTicket.model.find({user: req.user.id}).populate('experience').exec(function(err, tickets){
        if(err) { return res.apiError('1088', i18n.t('1088')); }
        if(!tickets) { return res.apiResponse({tickets: []}); }
        var groupedTickets = _.groupBy(tickets, function(ticket){ return ticket.experience.id; });
        var mappedTickets = _.map(groupedTickets, function(ticket){ 
            var ticket = ticket;
            var result = { experience: ticket[0].experience };
            result.myTickets = _.filter(ticket, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used===false)});
            result.myTickets = (result.myTickets)?result.myTickets.length:0;
            result.usedTickets = _.filter(ticket, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used===true)});
            result.usedTickets = (result.usedTickets)?result.usedTickets.length:0;
            return result;
        });
        async.each(mappedTickets, function(ticket, cb) {
            ticket.experience.getMediaHavenUrls(function(ticket) {
                cb();
            });
        }, function(err) {
            if(err) { return res.apiError('1088', i18n.t('1088')); }
            
            return res.apiResponse({tickets: mappedTickets});
        });
    });
}


/*
 * Use an ExperienceTicket
 * */
exports.use = function(req, res) {
    ExperienceTicket.model.find({experience: req.body.id, user: req.user.id, used: false}).populate('experience').exec(function(err, tickets){
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!tickets) return res.apiError('1088', i18n.t('1088'));
        var amount = parseInt(req.body.amount);
        if(!amount || amount < 0) { return res.apiError('1092', i18n.t('1092')); }
        if(tickets.length < amount) { return res.apiError('1089', i18n.t('1089')); }
        
        var ticketsToValidate = tickets.slice(0, amount);
        var usageDate = new Date();
        async.each(ticketsToValidate, function(ticket, cb){
            if(ticket.used) { return cb('1091'); }
            ticket.used = true;
            ticket.usedDate = usageDate;
            ticket.save(function(err){
                if(err) { return cb('1091', i18n.t('1091')); }
                return cb();
            });
        }, function(err) {
            if(err){ return res.apiError(err, i18n.t(err));}
            return res.apiResponse({experience: ticketsToValidate[0].experience, usedTickets: ticketsToValidate.length, myTickets: tickets.length - ticketsToValidate.length});
        });
        
    });
}