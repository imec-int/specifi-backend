require('dotenv')().load();

var assert = require('assert'),
    should = require('should'),
    request = require('supertest');
var keystone = require('../server');
var app = require('../server').app,
    User = keystone.list('User'),
    Challenge = keystone.list('Challenge'),
    UserChallenge = keystone.list('UserChallenge'),
    agent = request.agent(app),
    testUserId = null;


//*******************************TESTS*******************************//

describe('USER TESTS', function(){


    //Set up Test admin user
    before(function(done){
        var testChallenge = new Challenge.model({
            name:"TestChallenge",
            location: { geo: ['4.46654','24.34244'] }
        });

        testChallenge.save(function(err, challenge) {
            if(err) return done(err);
            var testUser = new User.model({
                username: 'TestUser',
                password: 'tester',
                password_confirm: 'tester',
                email: 'test@iminds.be',
                isAdmin: true
            });
            testUser.save(function(err, user) {
                if(err) return done(err);
                testUserId = user._id;
                var testUserChallenge = new UserChallenge.model({
                    challenge: challenge,
                    user: user
                });
                testUserChallenge.save(function(err){
                    if(err) done(err);
                    done();
                });

            });
        });

    });

    //Clean up
    after(function(done){
        User.model.remove({username: /test/i}, function(err, user) {
            if(err) done(err);
            Challenge.model.remove({name: 'TestChallenge'}, function(err) {
                if(err) done(err);
                UserChallenge.model.remove({user: testUserId}, function(err) {
                    if(err) return done(err);
                    done();
                });
            });
        });
    });
    
    //Test Login endpoint
    describe('POST /api/user/login', function(){
        agent = request.agent(app);
        it('respond with an error', function(done){
            agent
                .post('/api/user/login')
                .send({"email":"", "password":"tester"})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with correct User object', function(done){
            agent
                .post('/api/user/login')
                .send({"email":"test@iminds.be", "password":"tester"})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
    
                    res.body['user'].should.not.be.null;
                    res.body['user'].username.should.eql('TestUser');
                    res.body['user'].email.should.eql('test@iminds.be');
                    res.body['user'].isAdmin.should.be.true;
                    done();
                });
        });
    });
    
    //Test register endpoint
    describe('POST /api/user/register', function(){
        it('register User with bare minimum fields', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser2",
                    "email":"test2@iminds.be",
                    "password":"tester",
                    "password_confirm":"tester"
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
                    res.body['success'].should.be.true;
                    done();
                });
        });
        it('register User with all fields except photo', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser3",
                    "email":"test3@iminds.be",
                    "password":"tester",
                    "password_confirm":"tester"
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
                    res.body['success'].should.be.true;
                    done();
                });
        });
        it('should return an error if username is not unique', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser",
                    "email":"test4@iminds.be",
                    "password":"tester",
                    "password_confirm":"tester"
                })
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('should return an error if email is not unique', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser4",
                    "email":"test@iminds.be",
                    "password":"tester",
                    "password_confirm":"tester"
                })
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('should return an error if passwords do not match', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser4",
                    "email":"test4@iminds.be",
                    "password":"tester",
                    "password_confirm":"tester4"
                })
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('should return an error if password is empty', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser5",
                    "email":"test5@iminds.be",
                    "password":"",
                    "password_confirm":""
                })
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('should return an error if password is less than 5 characters', function(done){
            request(app)
                .post('/api/user/register')
                .send({
                    "username":"TestUser6",
                    "email":"test6@iminds.be",
                    "password":"re",
                    "password_confirm":"re"
                })
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('should throw an error if photo is wrong filetype', function(done){
            request(app)
                .post('/api/user/register')
                .field("username", "TestUser5")
                .field("email", "test5@iminds.be")
                .field("password", "tester")
                .field("password_confirm", "tester")
                .attach('photo_upload', 'test/files/wrong_file.txt')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Test Get User endpoint
    describe('GET /api/user/id', function(){
        it('respond with correct User object', function(done){
            agent
                .get('/api/user/'+testUserId)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
    
                    res.body['user'].should.not.be.null;
                    res.body['user'].username.should.eql('TestUser');
                    res.body['user'].email.should.eql('test@iminds.be');
                    res.body['user'].isAdmin.should.be.true;
                    done();
                });
        });
        it('respond with page not found if userid is empty', function(done){
            agent
                .get('/api/user/')
                .expect(404)
                .end(done);
        });
        it("respond with error if userid doesn't exist", function(done){
            agent
                .get('/api/user/rer90839424')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Test Change password endpoint
    describe('POST /api/user/changepassword', function(){
        it("respond with error if passwords don't match", function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"tester","newPassword":"tes2","newPassword_confirm":"tester2"})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it("respond with error if passwords are empty", function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"tester","newPassword":"","newPassword_confirm":""})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it("respond with error if old password is wrong", function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"dfsdf","newPassword":"tester2","newPassword_confirm":"tester2"})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with success', function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"tester","newPassword":"tester2","newPassword_confirm":"tester2"})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
                    res.body['success'].should.be.true;
                    done();
                });
        });
        it('respond with success if you try to change the password after already changing it once', function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"tester2","newPassword":"tester3","newPassword_confirm":"tester3"})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
                    res.body['success'].should.be.true;
                    done();
                });
        });
    });
    
    //Test Check if username exists endpoint
    describe('GET /api/user/?username/username/unique', function(){
        it('respond error if not unique', function(done){
            request(app)
                .get('/api/user/TestUser/username/unique')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with error if not unique in different case', function(done){
            request(app)
                .get('/api/user/TeStUsEr/username/unique')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with page not found if empty', function(done){
            request(app)
                .get('/api/user//username/unique')
                .expect(404)
                .end(done);
        });
        it('respond with true if unique', function(done){
            request(app)
                .get('/api/user/BlahBlah/username/unique')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err,res){
                    if(err) return done(err);
                    res.should.not.be.null;
                    res.body['unique'].should.be.true;
                    done();
                });
        });
    });
    
    //Test Check if email exists endpoint
    describe('GET /api/user/?email/email/unique', function(){
        it('respond error if not unique', function(done){
            request(app)
                .get('/api/user/test@iminds.be/email/unique')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with error if not unique in different case', function(done){
            request(app)
                .get('/api/user/TEST@iminds.be/email/unique')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
        it('respond with page not found if empty', function(done){
            request(app)
                .get('/api/user//email/unique')
                .expect(404)
                .end(done);
        });
        it('respond with true if unique', function(done){
            request(app)
                .get('/api/user/blabla@iminds.be/email/unique')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err,res){
                    if(err) return done(err);
                    res.should.not.be.null;
                    res.body['unique'].should.be.true;
                    done();
                });
        });
    });
    
    //Test Get all UserChallenges for User endpoint
    describe('GET /api/user/?userid/challenges', function(){
        it('respond with a list of Challenges', function(done){
            agent
                .get('/api/user/'+testUserId+'/challenges')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
    
                    res.body.should.not.be.null;
                    res.body['challenges'].should.not.be.null;
                    res.body['challenges'].length.should.eql(1);
                    res.body['challenges'][0].challenge.should.not.be.null;
                    done();
                });
        });
        it('respond with page not found if userid is empty', function(done){
            agent
                .get('/api/user//challenges')
                .expect(404)
                .end(done);
        });
        it("respond with error if userid doesn't exist", function(done){
            agent
                .get('/api/user/543253463/challenges')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Test logout endpoint
    describe('POST /api/user/logout', function(){
        it('respond with correct User object', function(done){
            agent
                .post('/api/user/logout')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
    
                    res.body['success'].should.be.true;
                    done();
                });
        });
    });
    
    
    //*******************************LOGGED OUT TESTS*******************************//
    
    //Get user test
    describe('GET /api/user/id', function(){
        it('respond with error if logged out', function(done){
            agent
                .get('/api/user/'+testUserId)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Change password test
    describe('POST /api/user/changepassword', function(){
        it('respond with error if logged out', function(done){
            agent
                .post('/api/user/changepassword')
                .send({"oldPassword":"tester","newPassword":"tester2","newPassword_confirm":"tester2"})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Get user challenges
    describe('GET /api/user/?userid/challenges', function(){
        it('respond with error if logged out', function(done){
            agent
                .get('/api/user/'+testUserId+'/challenges')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
    
    //Test Get all UserChallenges for User endpoint
    describe('GET /api/user/?userid/challenges', function(){
        it('respond with error if logged out', function(done){
            agent
                .get('/api/user/'+testUserId+'/challenges')
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });

});




