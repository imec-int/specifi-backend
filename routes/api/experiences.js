var _ = require('underscore'),
    keystone = require('keystone'),
    logUtils = require('../../lib/util/log-utils'),
    emailUtils = require('../../lib/util/email-utils'),
    async = require('async'),
    moment = require('moment'),
    i18n = require('i18next');
var Experience = keystone.list('Experience');
var ExperienceTicket = keystone.list('ExperienceTicket');


/*
 * Gets a list of all current Experiences
 * */
exports.list = function(req, res) {
    Experience.model.find({inStore: true}).exec(function(err, experiences){
        if(err) return res.apiError('1082', i18n.t('1082'));
        

        //Check if experience isn't in the past
        experiences = _.reject(experiences, function(experience){
            return (experience.end && moment().isAfter(experience.end, 'day'));
        });
        if(!experiences) { return res.apiResponse({experiences: []}); }
        
        keystone.populateRelated(experiences, 'ticketsSold', function(err){
            async.each(experiences, function(experience, cb) {
                experience.getMediaHavenUrls(function(experience) {
                    cb();
                });
            }, function(err) {
                var response = _.map(experiences,function(experience){ 
                    var transformedExperience = { experience: experience};
                    transformedExperience.ticketsSold = (experience.ticketsSold)?experience.ticketsSold.length:0;
                    transformedExperience.myTickets = _.filter(experience.ticketsSold, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used === false); });
                    transformedExperience.myTickets = (transformedExperience.myTickets)?transformedExperience.myTickets.length:0;
                    transformedExperience.usedTickets = _.filter(experience.ticketsSold, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used===true)});
                    transformedExperience.usedTickets = (transformedExperience.usedTickets)?transformedExperience.usedTickets.length:0;
                    return transformedExperience;
                }, this);
                
                //Reject experiences with no more tickets available
                response = _.reject(response, function(experience){
                    return (experience.ticketsSold >= experience.experience.tickets);
                });
                return res.apiResponse({
                    experiences: response
                });
            });
        });
    });
}

/*
 * Get a specific Experience
 * */
exports.get = function(req, res) {
    Experience.model.findOne({_id: req.params.id}).exec(function(err, experience){
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!experience) return res.apiError('1081', i18n.t('1081'));
        experience.populateRelated('ticketsSold', function(err){
            experience.getMediaHavenUrls(function(experience) {
                var response = {
                    experience: experience
                };
                response.ticketsSold = (experience.ticketsSold)?experience.ticketsSold.length:0;
                response.myTickets = _.filter(experience.ticketsSold, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used===false)});
                response.myTickets = (response.myTickets)?response.myTickets.length:0;
                response.usedTickets = _.filter(experience.ticketsSold, function(ticket) { return (ticket.user.toString() === req.user._id.toString() && ticket.used===true)});
                response.usedTickets = (response.usedTickets)?response.usedTickets.length:0;
                return res.apiResponse(response);
            });
        });
    });
}


/*
 * Buy an Experience
 * */
exports.buy = function(req, res) {
    ExperienceTicket.model.find({experience:req.body.id}).exec(function(err, tickets){
        if(err || !tickets) return res.apiError('1084', i18n.t('1084'));
        Experience.model.findOne({_id: req.body.id, inStore: true}).exec(function(err, experience){
            if(err) { return res.apiError('1000', i18n.t('1000')); }
            if(!experience) { return res.apiError('1081', i18n.t('1081')); }
            
            var amountOfTickets = parseInt(req.body.amount);
            
            //Check if experience isn't in the past
            if(moment().isAfter(experience.end, 'day')){
                return res.apiError('1087', i18n.t('1087'));
            }
            
            //Check if there are any tickets left
            if(experience.tickets <= tickets.length) { return res.apiError('1083',i18n.t('1083')); }
            //Check if enough tickets left
            if(amountOfTickets > (experience.tickets - tickets.length)) { return res.apiError('1085', i18n.t('1085')); }
            //Check if user has enough tokens
            var totalCost = experience.cost * amountOfTickets;
            if(req.user.score < totalCost) { return res.apiError('1086', i18n.t('1086')); }

            //Create tickets
            async.times(amountOfTickets, function(n, next){buyTicket(experience.id, req.user, experience.cost, next);}, function(err, tickets) {
                if(err) { return res.apiError('1084', i18n.t('1084')); }
                req.user.ticketBoughtEmail(amountOfTickets, experience, function(err){
                    if(err) console.log("User bought ticket! Email error: "+err);
                    emailUtils.ticketBoughtSupportEmail(req.user, amountOfTickets,experience, function(err){
                        if(err) console.log("User bought ticket! Support email error: "+err);
                        return res.apiResponse({tickets: tickets, user: req.user});
                    });
                });
            });
            
        });
    });
    
}


//*************UTILS***************//

/*
* Creates ExperienceTickets and deducts tokens for user
* */
function buyTicket(experience, user, unitCost, callback) {
    var ticket = new ExperienceTicket.model({ 
        experience: experience,
        user: user.id
    });
    
    ticket.save(function(err, ticket){
        if(err) { return callback(err, null); }
        user.score -= unitCost;
        user.save(function(err){
            logUtils.logPoints([{user: user, action: ticket.id, actionType:logUtils.EXPERIENCE_TICKET, score: -Math.abs(unitCost)}], function(err){
                callback(null, ticket);
            });
        });
    });
}
