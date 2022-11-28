const server = require('../app');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);
var superagent = require('superagent');
var agent; //superagent.agent();
const data = require('./data/logindata.json');

describe('Customer Endpoints', () => {

    //beforeAll('Login check',  (done) => {
    beforeAll(() => {
      console.log('Inside top : >>>');
      jest.setTimeout(30000);
      const response = await supertest('http://localhost:3080')
        .post('/api/login')
        // .set('Accept', 'application/json')
        // .set('Content-Type', 'application/json')
        .send(JSON.stringify(data))
        .end(function (err, res) {
          console.log('Inside inside : >>>');
          if (err) {
            throw err;
          }
          agent = res.agent();
          agent._saveCookies(res);
          done();
        });
    });

    it('GET /detail should show all users', (done) => {
      var req = supertest('http://localhost:3080')
         .get('/api/customer/detail/2');
        agent.attachCookies(req);
        req.expect(200, done);

      // agent._attachCookies(req);
      // supertest('http://localhost:3000')
      //   .get('api/customer/detail/2')
      //   .end(function(err, res){
      //       // expect(res.statusCode).toEqual(200);
      //       console.log('>>>>>'+res.statusCode);
      //       if(err) {
      //           throw err;
      //       }
      //       done();
      // });
    });
  
  });