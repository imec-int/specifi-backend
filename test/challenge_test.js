require('dotenv')().load();

var assert = require('assert'),
    should = require('should'),
    request = require('supertest');
var keystone = require('../server'),
    User = keystone.list('User'),
    Challenge = keystone.list('Challenge'),
    Waypoint = keystone.list('Waypoint'),
    async = require('async');
var app = require('../server').app,
    agent,challengeId,challengeName,testChallenges;

describe('CHALLENGE TESTS', function(){
    
    describe('LOGGED IN', function() {
        //Set up Test admin user
        before(function(done){
            agent = request.agent(app);
            var wp = new Waypoint.model({name: 'WP1', location: { geo: [4.264204899999988961,56.830799100000067924] }});
            
            wp.save(function(err, waypoint) {
                if(err) return done(err);


                testChallenges = [{
                    name:"TestChallenge",
                    location: { geo: [3.2642048999999815351,50.830799100000056124] },
                    status: 1,
                    waypoints:[waypoint._id]
                },{
                    name:"TestChallenge2",
                    location: { geo: [3.2642048999999815241,50.830799100000090124] },
                    status: 1,
                    waypoints:[waypoint._id]
                }, {
                    name:"TestChallenge3",
                    location: { geo: [3.264204899999988951,50.830799100000067124] },
                    status: 1,
                    waypoints:[waypoint._id]
                }, {
                    name:"FarawayChallenge",
                    location: { geo: [4.264204899999988951,56.830799100000067124] },
                    status: 1,
                    waypoints:[waypoint._id]
                }];
                async.each(testChallenges, function(challenge, cb){
                    var testChallenge = new Challenge.model(challenge);
                    testChallenge.save(function(err, challenge) {
                        if(err) return cb(err);
                        if(!challengeId) challengeId = challenge._id;
                        if(!challengeName) challengeName = challenge.name;
                        cb();
                    });
                }, function(err){
                    var testUser = new User.model({
                        username: 'TestUser',
                        password: 'tester',
                        password_confirm: 'tester',
                        email: 'test@iminds.be',
                        isAdmin: true
                    });
                    testUser.save(function(err, user) {
                        if(err) done(err);

                        agent
                            .post('/api/user/login')
                            .send({email:'test@iminds.be', password: 'tester'})
                            .end(done);
                    });
                });
            });
            
        })

        //Clean up
        after(function(done){
            User.model.remove({username: /test/i}, function(err, user) {
                if(err) done(err);
                async.each(testChallenges, function(challenge, cb){
                    Challenge.model.find({name: challenge.name}).remove().exec(function(err) {
                        cb();
                    });
                }, function(err){
                    if(err) return done(err);
                    agent
                        .post('/api/user/logout')
                        .send({email:'test@iminds.be', password: 'tester'})
                        .end(done);
                });
            });
        })

        //Test GET all challenges
        describe('GET /api/challenge/list', function(){
            it('respond with a list of Challenges', function(done){
                agent
                    .get('/api/challenge/list')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res){
                        if(err) return done(err);
                        res.body['challenges'].should.not.be.null;
                        res.body['challenges'].length.should.not.eql(0);
                        done();
                    });
            })
        })


        //Test GET specific challenge
        describe('GET /api/challenge/id', function(){
            it('respond with the correct Challenge', function(done){
                agent
                    .get('/api/challenge/'+challengeId)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res){
                        if(err) return done(err);
                        res.body['challenge'].should.not.be.null;
                        res.body['challenge'].name.should.eql(challengeName);
                        done();
                    });
            })
            it('respond with an error', function(done){
                agent
                    .get('/api/challenge/sdfdsfsdf')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })
        
        
        //Test GET nearby challenges
        describe('GET /api/challenge/nearby', function(){
            it('respond with a list of Challenges nearby', function(done){
                agent
                    .get('/api/challenge/nearby/3.2642048999999815241,50.830799100000090124/distance/1000')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res){
                        if(err) return done(err);

                        res.body['challenges'].should.not.be.null;
                        res.body['challenges'].length.should.eql(3);
                        res.body['challenges'].should.not.matchEach(function(challenge) { return challenge.name ==='FarawayChallenge' });
                        done();
                    });
            })
        })
    })

    describe('LOGGED OUT', function(){
        //Test GET all challenges
        describe('GET /api/challenge/list', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/challenge/list')
                    .expect(500)
                    .end(done);
            })
        })


        //Test GET specific challenge
        describe('GET /api/challenge/id', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/challenge/'+challengeId)
                    .expect(500)
                    .end(done);
            })
        })
        
        //Test GET nearby challenges
        describe('GET /api/challenge/nearby', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/challenge/nearby/3.2642048999999815241,50.830799100000090124/distance/1000')
                    .expect(500)
                    .end(done);
            })
        })
    })

});


