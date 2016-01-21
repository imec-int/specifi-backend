var moment = require('moment'),
    _ = require('underscore'),
    twix = require('twix');
/*
 * Returns the availability based on conditions
 * */
exports.check = function(days, start, end) {
    var available = true;
    var now = moment();
    if(days) {
        available = false;
        days = days.replace(/ /g,'');
        var daysToCheck = days.split(';');
        var dayAndTimes = [];
        _.each(daysToCheck, function(dayString) {
            if(dayString) {
                var day = { dayOfTheWeek: null, hourRanges: null };
                day.dayOfTheWeek = dayString.match(/[a-z]+/i)[0];
                day.hourRanges = dayString.match(/([0-9]{2}\:[0-9]{2}\-[0-9]{2}\:[0-9]{2})+/g);
                if(day.dayOfTheWeek)
                    dayAndTimes.push(day);
            }
        });
        
        if(dayAndTimes.length > 0) {
            _.each(dayAndTimes, function(dayAndTime) {
                //Check same day of the week
               if(moment.weekdays(now.day()).toLowerCase() === dayAndTime.dayOfTheWeek.toLowerCase()){
                   if(dayAndTime.hourRanges){
                       //Check hours
                       _.each(dayAndTime.hourRanges, function(hourRange){
                           var reg = /(\d{2}:\d{2})-(\d{2}:\d{2})/;
                           var times = reg.exec(hourRange);
                           if(times && times.length === 3) {
                               var hourRegExp = /([0-9]{2})\:([0-9]{2})/;
                               var range = moment.twix(moment().hour(hourRegExp.exec(times[1])[1]).minute(hourRegExp.exec(times[1])[2]),moment().hour(hourRegExp.exec(times[2])[1]).minute(hourRegExp.exec(times[2])[2]));
                               if(range.contains(now)) {
                                   available = true;
                               }
                           }
                       });
                   } else {
                       available = true;
                   }
               }
            });
        }
    }

    if(start) {
        if(now.isBefore(start, 'day')) {
            available = false;
        }
    }

    if(end) {
        if(now.isAfter(end, 'day')) {
            available = false;
        }
    }
    return available;
};