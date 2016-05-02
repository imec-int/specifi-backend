require('dotenv')().load();

var assert = require('assert'),
    should = require('should'),
    request = require('supertest');
var keystone = require('../server');
var app = require('../server').app,
    User = keystone.list('User'),
    Challenge = keystone.list('Challenge'),
    UserChallenge = keystone.list('UserChallenge'),
    async = require('async'),
    userId,
    challengeId,
    challengeName,
    testChallenges;

describe('USERCHALLENGE TESTS', function(){
    
    describe('LOGGED IN', function(){
        before(function(done){
            agent = request.agent(app);
            testChallenges = [{
                name:"TestChallenge",
                location: { geo: [3.2642048999999815351,50.830799100000056124] }
            },{
                name:"TestChallenge2",
                location: { geo: [3.2642048999999815241,50.830799100000090124] }
            }, {
                name:"TestChallenge3",
                location: { geo: [3.264204899999988951,50.830799100000067124] }
            }, {
                name:"FarawayChallenge",
                location: { geo: [4.264204899999988951,56.830799100000067124] }
            }];

            async.each(testChallenges, function(challenge, cb){
                var testChallenge = new Challenge.model(challenge);
                testChallenge.save(function(err, challenge) {
                    if(err) return cb(err);
                    if(!challengeId) {
                        challengeId = challenge._id;
                        challengeName = challenge.name;
                    } 
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
                    userId = user._id;
                    agent
                        .post('/api/user/login')
                        .send({email:'test@iminds.be', password: 'tester'})
                        .end(function(err){
                            var userChallenge = new UserChallenge.model({challenge: challengeId, user: user._id});
                            userChallenge.save(function(err, userChallenge){
                                if(err) done(err);
                                done();
                            });
                        });
                });
            });
        })
        
        after(function(done){
            User.model.remove({username: /test/i}, function(err, user) {
                if(err) done(err);
                async.each(testChallenges, function(challenge, cb){
                    Challenge.model.find({name: challenge.name}).remove().exec(function(err) {
                        cb();
                    });
                }, function(err){
                    if(err) return done(err);
                    UserChallenge.model.find({challenge: challengeId}).remove().exec(function(err) {
                        if(err) return done(err);
                        agent
                            .post('/api/user/logout')
                            .send({email:'test@iminds.be', password: 'tester'})
                            .end(done);
                    });
                });
            });
        })
        
        
        //**************************TESTS**************************//

        //Test GET a specific userchallenge
        describe('GET /api/userchallenge/id', function(){
            it('respond with a specific UserChallenge', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if(err) return done(err);
                        res.body['challenge'].should.not.be.null;
                        res.body['challenge'].name.should.eql(challengeName);
                        res.body['user']._id.should.eql(userId.toString());
                        res.body['complete'].should.be.false;
                        res.body['completedWP'].length.should.eql(0);
                        done();
                    });
            })
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/43949249894820')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })

        //Test GET completed userchallenges
        /*
        describe('GET /api/userchallenge/id/completed', function(){
            before(function(done){
                UserChallenge.model.findOne({challenge: challengeId}, function(err, userChallenge) {
                    if(err) return done(err);
                    userChallenge.complete = true;
                    userChallenge.save(function(err) {
                        if(err) return done(err);
                        done();
                    });
                });
            })
            
            it('respond with a list of completed instances of UserChallenge for a specific Challenge', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId+'/completed')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if(err) return done(err);
                        console.log(res.body);
                        res.body['challenges'].should.not.be.null;
                        res.body['challenges'].length.should.eql(1);
                        res.body['challenges'][0].complete.should.be.true;
                        done();
                    });
            })
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/43949249894820/completed')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })*/
    })
    
    describe('LOGGED OUT', function(){
        
        //Test GET a specific userchallenge
        describe('GET /api/userchallenge/id', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId)
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })

        //Test get completed instances of a userchallenge
        /*describe('GET /api/userchallenge/id/completed', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId + '/completed')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })*/

        //Test start a userchallenge
        describe('GET /api/userchallenge/id/start', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId + '/start')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })

        //Test stop a userchallenge
        describe('GET /api/userchallenge/id/stop', function(){
            it('respond with an error', function(done){
                agent
                    .get('/api/userchallenge/'+challengeId + '/stop')
                    .expect('Content-Type', /json/)
                    .expect(500)
                    .end(done);
            })
        })

        
    })
})
