const express = require('express');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended : false});
const app = express();
var cors = require('cors')
var swaggerJSDoc = require('swagger-jsdoc');
const client = require('./utils/queries');

const passport = require("passport");
require("./utils/passportConfig")(passport);
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// const { Client } = require('pg');
// const client = new Client();
// client.connect();

app.use(bodyParser.json());
app.use(urlencodedParser);
app.use(cors());
app.use(
  session({
    secret: "secret-key",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

var auth = function(req, res, next){
  if (!req.isAuthenticated())
   res.sendStatus(401);
  else next();
  };



passport.serializeUser((user, done) => {
  console.log("Serialize User " + user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  client.query('SELECT id, name FROM customer WHERE id = $1', [id], function (err, data) {
    if(err) return done(err);
    done(null, {id: data.rows[0].id, name: data.rows[0].name});
  });
}
);


const customerRouter = require('./model/customer');
const orderRouter = require('./model/order');
const productRouter = require('./model/product');
const cartRouter = require('./model/cart');
const cardRouter = require('./model/card');

app.use(bodyParser.urlencoded({ extended: true }));

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Ecommerce Swagger API',
    version: '1.0.0',
    description: 'An ecommerce RESTful API with Swagger',
    servers: [
      {
        url: "http://localhost:3000/",
      },
    ],
  },
  host: 'localhost:3000',
  basePath: '/',
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./model/js/*.js'],
};

// initialize swagger-jsdoc
 var swaggerSpec = swaggerJSDoc(options);

// serve swagger
app.get('/docs/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Register
 *     description: Register a costomer
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: details
 *         description: Enter the name and password
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - password
 *           properties:
 *             name:
 *              type: string
 *             password:
 *               type: string
 *     responses:
    *          '200':
    *              description: Register
    *              content:
    *                  'application/json':
    *                      schema:
    *                          type: object
    *                          description: test response
    *                      "headers": {
    *                          "Access-Control-Allow-Origin": {
    *                           "type": "string"
    *                          }
    *                       }
 *           
 */

app.post(
  "/api/signup",
  passport.authenticate("local-signup"),
  (req, res, next) => {
    console.log(`response : ${res} `);
    res.json({
      user: req.user,
    });
  }
);

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Login
 *     description: Login
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: details
 *         description: Enter the name and password
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - password
 *           properties:
 *             name:
 *              type: string
 *             password:
 *               type: string
 *     responses:
    *          '200':
    *              description: Login
    *              content:
    *                  'application/json':
    *                      schema:
    *                          type: object
    *                          description: test response
    *                      "headers": {
    *                          "Access-Control-Allow-Origin": {
    *                           "type": "string"
    *                          }
    *                       }
 *           
 */
app.post("/api/login",
  passport.authenticate("local-login"),
  (req, res, next) => {
    res.json({ user: req.user });
  }
);

app.post("/api/auth/google/login/success",
  passport.authenticate("google-login"),
  (req, res, next) => {
    console.log('Inside google authenticate');
    res.json({ user: req.user });
  }
);



// app.use(auth);

app.use('/api/customer', customerRouter);
app.use('/api/orders', orderRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/card', cardRouter)

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3080;
}
app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`)
})










// const express=require("express"); 
// const app= express();        //binds the express module to 'app'
// const bodyParser = require('body-parser');
// const db = require('./utils/queries');

// app.use(bodyParser.json());
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );


// // app.get("/", function(req,res){
// //     res.send("Welcome to the world of science fiction, conflicting theories, fantasies and some eccentric nerds!")
// //   });
// app.get('/', (request, response) => {
//     response.json({
//         info: 'Node.js, Express, and Postgres API'
//     })
// })
// app.get('/products', db.getProducts);

// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }
// app.listen(port, () => {
//   console.log(`Server started and listening on port ${port}`)
// })
