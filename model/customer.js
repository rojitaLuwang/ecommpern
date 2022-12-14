//const { Client } = require('pg');
const express = require('express');
const bcrypt = require("bcryptjs");
const bodyParser = require('body-parser');
const app = express();
const customerRouter = express.Router();
const client = require('../utils/queries');
const isAuthorized = require('../utils/isAuthorized');
const { nameExists, matchPassword } = require("../model/register");

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

update_password_query = {
  name: 'update-password',
  text: 'update customer set password  = $2 where id = $1 RETURNING name'
};

customer_contact_query = {
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
  text: 'UPDATE customer SET address_1 = $1, address_2 = $2, postcode = $3, phone = $4, email = $5 WHERE id = $6',
};


getAllCustomers = async function (){
  const res = await client.query(all_customers_query);
  return res.rows;
};
 

updatePassword = async function(customerId, password){
  update_password_query['values'] = [customerId, password];
  const res = await client.query(update_password_query);
  return res.rowCount;

}

getCustomerContactInfo = async function (customerId){
  customer_contact_query['values'] = [customerId];
    const res = await client.query(customer_contact_query);
    return res;
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

updateCustomerDetail = async function(address_1 = null, address_2 = null, postcode = null, phone = null,email = null, customerId){
  update_customer_detail_query['values'] = [address_1, address_2, postcode, phone, email, customerId];
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
    (async () => {
      const result = await getCustomerContactInfo(req.params.id);
      const details = JSON.stringify(result.rows);
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


  customerRouter.post('/detail/:userId', (req, res) => {
    console.log("Inserting customer detail " + req.params.userId);
    const body = req.body;
    console.log(`>>>>>> ${body.address_1} >>>>> ${body.phone}`);
    (async () => {
       res.send(await updateCustomerDetail(body.address_1, body.address_2, body.postcode, body.phone, body.email, req.params.userId));
    })()
    
  });
 
  customerRouter.post('/email/:id', (req, res) => {
    console.log("Fetching  email using user id " + req.params.id);
    (async () => {
       res.send(await updateCustomerDetail(body.address_1, body.address_2, body.postcode, body.phone, req.params.id));
    })()
    
  });

  customerRouter.post('/changepassword/:userId', (req, res) => {
    (async () => {
      console.log("Fetching  email using user id " + req.params.userId);
      const result = await getCustomerContactInfo(req.params.userId);
      let updateSuccess = false;
      if (result.rowCount > 0){
        const name = result.rows[0].name;
        const user = await nameExists(name);
        if (user) {
          const isMatch = await matchPassword(req.body.current_password, user.password);
          console.log(`isMatch ${isMatch} id ${req.params.userId} name ${name}`);
          if (isMatch){
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.new_password, salt);            
            const rowCount = await updatePassword(req.params.userId, hash)
            updateSuccess = rowCount > 0;
          }
        }
      }
      console.log(`Result : ${updateSuccess}`);
      if (updateSuccess){
        res.send(JSON.stringify(updateSuccess));
      }else{
        res.send(JSON.stringify("Failed to update password"));
      }
    })()
    
  });

  

  module.exports = customerRouter;
  