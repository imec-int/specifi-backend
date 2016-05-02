require('dotenv')().load();

var assert = require('assert'),
    should = require('should'),
    request = require('supertest');
var keystone = require('../server');
var app = require('../server').app;


before(function(done){
        request = request(app);
        done();
});

//*******************************TESTS*******************************//

describe('UTIL TESTS', function(){
    
    //Test ping
    describe('GET /api/ping', function(){
        it('respond with json', function(done){
            request
                .get('/api/ping')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res){
                    if(err) return done(err);
    
                    res.should.not.be.null;
                    res.body['connection'].should.eql('1');
                    res.body['version'].should.match(/^\d+\.\d+\.\d+$/);
                    done();
                });
        });
    });

});