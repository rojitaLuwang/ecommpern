//const { Client } = require('pg');
const { json } = require('body-parser');
const express = require('express');
const cardRouter = express.Router();
const client = require('../utils/queries');
const isAuthorized = require('../utils/isAuthorized');

cardRouter.use(isAuthorized);
// const client = new Client()
// client.connect()
/**
 * @swagger
 * definitions:
 *   Card:
 *     properties:
 *       id:
 *         type: integer
 *       nameOnCard:
 *         type: string
 *       cardNumber:
 *         type: string
 *       expiryDate:
 *         type: string
 *       cartType:
 *         type: string
 */

card_detail_query = {
    name: 'get-card-by-id',
    text: 'SELECT cd.* FROM "card_detail" cd, "customer" c WHERE cd.id = c.card_id and c.id = $1',
  };

card_detail_by_customer_query = {
    name: 'get-card-by-customer',
    text: 'SELECT cd.* FROM "card_detail" cd, "customer" c WHERE cd.id = c.card_id  and c.id = $1',
  };  

insert_card_detail_query = {
    name: 'insert-new-card',
    text: 'INSERT INTO "card_detail"(name_on_card, card_number, expiry_date, card_type) VALUES ($1, $2, $3, $4) returning id',
};

update_card_detail_into_customer_query = {
  name: 'update-new-card-in-customer',
  text: 'UPDATE "customer" SET card_id = $1 WHERE id = $2  returning card_id',
};

update_card_detail_query = {
    name: 'update-card-by-id',
    text: 'UPDATE "card_detail" SET name_on_card = $1, card_number = $2, expiry_date = $3, card_type = $4 WHERE id = $5',
};

getCardDetailInfo = async function (customerId){
    card_detail_query['values'] = [customerId];
    const res = await client.query(card_detail_query);
    return res;
};

getCardDetailByCustomer = async function (customerId){
  card_detail_by_customer_query['values'] = [customerId];
  const res = await client.query(card_detail_by_customer_query);
  const rows = res.rows;
  if (res.rowCount == 0) return JSON.stringify([]);
  return JSON.stringify(rows[0]);
};

insertCardDetail = async function(name_on_card, card_number, expiry_date, card_type){
    insert_card_detail_query['values'] = [name_on_card, card_number, expiry_date, card_type];
    const res = await client.query(insert_card_detail_query);
    const rows = res.rows;
    console.log('Card inserted rows : ' + rows[0].id);
    return rows[0].id
};


updateCardDetailInCustomer = async function(card_id, customerId){
  update_card_detail_into_customer_query['values'] = [card_id, customerId];
  const res = await client.query(update_card_detail_into_customer_query);
  const rows = res.rows;
  console.log('Card number inserted in customer : ' + rows[0].card_id);
};

updateCardDetail = async function(name_on_card, card_number, expiry_date, card_type, id){
    update_card_detail_query['values'] = [name_on_card, card_number, expiry_date, card_type, id];
    const res = await client.query(update_card_detail_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

/**
 * @swagger
 * /card/{id}:
 *   get:
 *     tags:
 *       - Card
 *     description: Get a card for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Card's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get a Card for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          nameOnCard: 'John Smith',
    *                          cardNumber: "1234565789763456",
    *                          expiryDate: '08-26'
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
cardRouter.get('/:id', (req, res) => {
    //console.log("Fetching card " + req.params.id);
    (async () => {
      const gotCard = await getCardDetailInfo(req.params.id);
      const details = JSON.stringify(gotCard.rows);
      console.log(`Card details: ${gotCard}`);
      res.send(details);
    })()
    
  });


cardRouter.get('/customer/:id', (req, res) => {
    console.log("Fetching card for customer" + req.params.id);
    (async () => {
      res.send(await getCardDetailByCustomer(req.params.id));
    })()
    
  });


/**
 * @swagger
 * /card/{id}:
 *   put:
 *     tags:
 *       - Card
 *     description: Update card for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Card's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get a card for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          nameOnCard: 'John Smith',
    *                          cardNumber: "1234565789763456",
    *                          expiryDate: '08-26'
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
cardRouter.put('/:id', (req, res) => {
    console.log("Updating card  " + req.params.id);
    const body = req.body;
    (async () => {
        await updateCardDetail(req.params.id, body.name_on_card, body.card_number, body.expiry_date, body.card_type);
        
       res.send(`Card ${req.params.id} updated..`);
    })()
    
  });
  
/**
 * @swagger
 * /card/{id}:
 *   post:
 *     tags:
 *       - Card
 *     description: Get a card for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: details
 *         description: Card's details
 *         in: body
 *         required: true
 *         type: object
 *         example: {
 *              id: 1,
*               nameOnCard: 'John Smith',
*               cardNumber: "1234565789763456",
*               expiryDate: '08-26'
 *          }
 *     responses:
    *          '200':
    *              description: Get a card for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          nameOnCard: 'John Smith',
    *                          cardNumber: "1234565789763456",
    *                          expiryDate: '08-26'
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
  cardRouter.post('/new/:id', (req, res) => {
    console.log("Creating new card.");
    console.log(req.body);
    const {name_on_card, card_number, expiry_date, card_type} = req.body;
    (async () => {
       const cardId = await insertCardDetail(name_on_card, card_number, expiry_date, card_type);
       await updateCardDetailInCustomer(cardId, req.params.id);
       res.send(`Card created with cardId ${cardId}`);
    })()
  });


  module.exports = cardRouter;
  