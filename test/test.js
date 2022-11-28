const server = require('../app');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);
var superagent = require('superagent');
var agent; //superagent.agent();
const data = require('./data/logindata.json');
const client = require('../utils/queries');

describe('Customer Endpoints', () => {
    it('GET /detail should show all users', (done) => {
        const runTest = (id) => {
            const response = supertest('http://localhost:3080')
            .post('/api/login')
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(data))
            .end(function (err, res) {
                expect(res.statusCode).toEqual(200);
                const {header} = res;
                supertest('http://localhost:3080')
                .get('/api/customer/detail/' + id)
                .set("Cookie", [header["set-cookie"]])
                .end(function(err, res){
                    expect(res.statusCode).toEqual(200);
                    const json = JSON.parse(res.text);
                    expect(json.length).toEqual(1);
                    expect(json[0].name).toEqual("TestRegister");
                    expect(json[0].address_1).toEqual("33");
                    if(err) {
                        throw err;
                    }
                    done();
                });
            });
        }
        resetCustomer(runTest);
    });
    const resetCustomer = (done) => {
        console.log("Deleting test customer");
        client.query("delete FROM customer where name = 'TestRegister'", [], function (err, data) {
            if(err) console.log(err);
            client.query("insert into customer(name, password, phone, address_1) values " +
            "('TestRegister', '$2a$10$Awt9IVfLxdpald49zJnHZOB8JoAzkv4yJeH0pOKW/eFmLmeDCbzIC', "+
            "'abc123', '33') returning id", [], function (err, data) {
                if(err) return done(err);

                const rows = data.rows;
                console.log('Customer inserted rows : ' + rows[0].id);
                done(rows[0].id);
            }); 
        });

    }
});