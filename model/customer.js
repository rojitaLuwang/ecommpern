//const { Client } = require('pg');
const express = require('express');
const bcrypt = require("bcryptjs");
const bodyParser = require('body-parser');
const app = express();
const customerRouter = express.Router();
const client = require('../utils/queries');
const isAuthorized = require('../utils/isAuthorized');

// const client = new Client()
// client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
customerRouter.use(isAuthorized);


/**
 * @swagger
 * definitions:
 *   Customer:
 *     type: object
 *     required:
 *       - password
 *       - phone
 *     properties:
 *       name:
 *         type: string
 *       password:
 *         type: string
 *       phone:
 *         type: integer
 */

all_customers_query = {
  name: 'get-customers',
  text: 'SELECT id, name, phone FROM customer limit 100' ,
};


customer_query = {
    name: 'get-customer-by-id',
    text: 'SELECT * FROM customer WHERE id = $1',
  };

delete_customer_query = {
    name: 'delete-customer-by-id',
    text: 'DELETE FROM customer WHERE id = $1',
};


update_customer_query = {
    name: 'update-customer-by-id',
    text: 'UPDATE customer SET password = $1, phone = $2 WHERE id = $3',
};

update_customer_detail_query = {
  name: 'update-customer-by-id',
  text: 'UPDATE customer SET address_1 = $1, address_2 = $2, postcode = $3, phone = $4 WHERE id = $5',
};


getAllCustomers = async function (){
  const res = await client.query(all_customers_query);
  return res.rows;
};

getCustomerInfo = async function (customerId){
    customer_query['values'] = [customerId];
    const res = await client.query(customer_query);
    const rows = res.rows;
    return JSON.stringify(rows[0]);
};

deleteCustomer = async function(customerId){
    delete_customer_query['values'] = [customerId];
    const res = await client.query(delete_customer_query);
    const rows = res.rows;
    return JSON.stringify(rows);
    
};

updateCustomer = async function(password, phone, customerId){
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`pw : ${hash} ph : ${phone} `);
    update_customer_query['values'] = [password, phone, customerId];
    const res = await client.query(update_customer_query);
    const rows = res.rows;
    return JSON.stringify(rows);
    
};

updateCustomerDetail = async function(address_1 = null, address_2 = null, postcode = null, phone = null, customerId){
  update_customer_detail_query['values'] = [address_1, address_2, postcode, phone, customerId];
  const res = await client.query(update_customer_detail_query);
  const rows = res.rows;
  return JSON.stringify(rows);
  
};



/**
 * @swagger
 * /customer:
 *   get:
 *     tags:
 *       - Customer
 *     description: Returns all customers
 *     produces:
 *       - application/json
 *     responses:
    *          '200':
    *              description: Get all customer
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
customerRouter.get('/', (req, res) => {
  console.log('Getting all users ');
  
  (async () => {
    res.send(await getAllCustomers());
  })()
  
});
/**
 * @swagger
 * /customer/{id}:
 *   get:
 *     tags:
 *       - Customer
 *     description: Get a customer for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Customer's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get a customer for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          name: Harry,
    *                          phone: 567891344
    *                      }
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
customerRouter.get('/detail/:id', (req, res) => {
    // console.log("Customer Details " + req.params.id);
    // console.log('user from session '+ req.user);
    // console.log('isAuthenticated '+ req.isAuthenticated());
    
    (async () => {
      const details = await getCustomerInfo(req.params.id);
      console.log(`Customer contact details : ${details}`);
      res.send(details);
    })()
    
  });
/**
 * @swagger
 * /customer/{id}:
 *   delete:
 *     tags:
 *       - Customer
 *     description: delete a customer with the given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Customer's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Delete a customer for the given id
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
  customerRouter.delete('/:id', (req, res) => {
    console.log("Deleting customer  " + req.params.id);
    (async () => {
        res.send(await deleteCustomer(req.params.id));
    })()
    
  });

  /**
 * @swagger
 * definitions:
 *   Customer:
 *     properties:
 *       name:
 *         type: string
 *       password:
 *         type: string
 *       phone:
 *         type: integer
 * /customer/{id}:
 *   put:
 *     tags:
 *       - Customer
 *     description: Update a customer with the given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Customer's id
 *         in: path
 *         type: integer
 *       - name: details
 *         description: Enter the password and phone number to update
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - password
 *             - phone
 *           properties:
 *             password:
 *              type: string
 *             phone:
 *               type: integer
 *     responses:
    *          '200':
    *              description: Update a customer for the given id
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
 *          
 */ 
  
  customerRouter.put('/:id', (req, res) => {
    console.log("Updating customer  " + req.params.id);
    const body = req.body;
    console.log(`>>>>>> ${body.password} >>>>> ${body.phone}`);
    (async () => {
       res.send(await updateCustomer(body.password, body.phone, req.params.id));
    })()
    
  });


  customerRouter.post('/detail/:id', (req, res) => {
    console.log("Inserting customer detail " + req.params.id);
    const body = req.body;
    console.log(`>>>>>> ${body.address_1} >>>>> ${body.phone}`);
    (async () => {
       res.send(await updateCustomerDetail(body.address_1, body.address_2, body.postcode, body.phone, req.params.id));
    })()
    
  });
 
  customerRouter.post('/email/:id', (req, res) => {
    console.log("Fetching  email using user id " + req.params.id);
    (async () => {
       res.send(await updateCustomerDetail(body.address_1, body.address_2, body.postcode, body.phone, req.params.id));
    })()
    
  });
  module.exports = customerRouter;
  