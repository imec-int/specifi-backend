var _ = require('underscore'),
    keystone = require('keystone'),
    MeetingHotspotTemplate = keystone.list('MeetingHotspotTemplate'),
    MeetingHotspot = keystone.list('MeetingHotspot'),
    moment = require('moment');

module.exports = function(agenda) {
    
    //Finds and creates a random meeting hotspot that doesn't exist yet
    agenda.define('spawnRandomMeetingHotspot', function(job, done) {
        MeetingHotspot.model.find().exec(function(err, hotspots) {
            if(err) { return done(err); }
            hotspots = _.where(hotspots, {active: true});
            hotspots = _.pluck(hotspots, 'template');
            MeetingHotspotTemplate.model.find({_id:{$nin: hotspots}, fixed: false, status: '1'}).exec(function(err, templates) {
                if(err) { return done(err); }
                if(!templates || templates.length === 0) { return done(); }
                var rand = Math.floor(Math.random() * templates.length);
                var template = templates[rand];
                if(!template) { return done(); }
                var data = { 
                    template: template,
                    start: moment(),
                    end: moment().add('m',template.duration)
                };
                
                var hotspot = new MeetingHotspot.model(data);
                hotspot.save(function(err, hotspot) {
                    if(err) { return done(err); }
                    return done();
                });
            });
        });
        
    });
}