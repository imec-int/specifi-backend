module.exports = function(jobTypes) {
    var Agenda = require('agenda');
    var keystone = require('keystone'),
        moment = require('moment');

    var agenda = new Agenda({name: 'playgroundAgenda', defaultLockLifetime: 5000, db:{address: keystone.get('mongo'), collection: 'agendaJobs'}, maxConcurrency: 200});
    agenda.processEvery('1 minute');

    //***********LOGGING*************//
    agenda.on('start', function(job) {
        console.log("Job %s starting %s", job.attrs.name, moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
    });

    agenda.on('complete', function(job) {
        console.log("Job %s finished %s", job.attrs.name, moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
    });

    agenda.on('fail', function(err, job) {
        console.log("Job failed with error: %s %s", err.message, moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
    });

    //***********REGISTER JOBS*************//
    jobTypes.forEach(function(type) {
        require('./jobs/'+type)(agenda);
    });

    //***********START*************//
    agenda.start();
    return agenda;
}