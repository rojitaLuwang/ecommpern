//const { Client } = require('pg');
const express = require('express');
const productRouter = express.Router();
const client = require('../utils/queries');

// const client = new Client()
// client.connect()
/**
 * @swagger
 * definitions:
 *   Product:
 *     properties:
 *       id:
 *         type: integer
 *       price:
 *         type: number
 *       name:
 *         type: string
 *       category:
 *         type: string
 */

product_query = {
    name: 'get-product-by-id',
    text: 'SELECT * FROM "product" WHERE id = $1',
  };

product_query_search = {
    name: 'get-product-by-search',
    text: 'SELECT * FROM "product" where name like $1',
  }; 
product_query_all = {
    name: 'get-product-by-category',
    text: 'SELECT * FROM "product"',
  };    

insert_product_query = {
    name: 'insert-new-product',
    text: 'INSERT INTO "product"(price, name, category) VALUES ($1, $2, $3) returning id',
};

update_product_query = {
    name: 'update-product-by-id',
    text: 'UPDATE "product" SET price = $1, category = $2 WHERE id = $3',
};

getProductInfo = async function (productId){
    product_query['values'] = [productId];
    const res = await client.query(product_query);
    const rows = res.rows;
    return JSON.stringify(rows[0]);
};

getProductsBySearch = async function (term){
  let res;
  if (term && term !== 'ALL'){
    product_query_search['values'] = ['%' + term + '%'];
    res = await client.query(product_query_search);
  }else{
    res = await client.query(product_query_all);
  }
  
  const rows = res.rows;
  return JSON.stringify(rows);
};

insertProduct = async function(price, name, category){
    insert_product_query['values'] = [price, name, category];
    const res = await client.query(insert_product_query);
    const rows = res.rows;
    console.log('Product inserted rows : ' + rows[0].id);
    return rows[0].id
};

updateProduct = async function(id, price, category){
    update_product_query['values'] = [price, category, id];
    const res = await client.query(update_product_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     tags:
 *       - Product
 *     description: Get a product for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Product's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get a product for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          price: 12.75,
    *                          name: Bottle,
    *                          category: GLASS
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

productRouter.get('/:id', (req, res) => {
    console.log("Fetching product " + req.params.id);
    (async () => {
      res.send(await getProductInfo(req.params.id));
    })()
    
  });

/**
 * @swagger
 * /product/:
 *   get:
 *     tags:
 *       - Product
 *     description: Get list of products for a given term
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: category
 *         description: Product's category
 *         in: query
 *         required: true
 *         type: string
 *         allowReserved: true
 *         example: GLASS
 *     responses:
    *          '200':
    *              description: Get products for the given term
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          price: 12.75,
    *                          name: Bottle,
    *                          category: GLASS
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
  productRouter.get('/search/:term', (req, res) => {
    (async () => {
      res.send(await getProductsBySearch(req.params.term));
    })()
    
  });

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     tags:
 *       - Product
 *     description: Update product for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Product's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get a product for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          price: 12.75,
    *                          name: Bottle,
    *                          category: GLASS
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
productRouter.put('/:id', (req, res) => {
    console.log("Updating product  " + req.params.id);
    const body = req.body;
    (async () => {
        await updateProduct(req.params.id, body.price, body.category);
        
       res.send(`Product ${req.params.id} updated..`);
    })()
    
  });
  
/**
 * @swagger
 * /product/{id}:
 *   post:
 *     tags:
 *       - Product
 *     description: Get a product for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: details
 *         description: Product's details
 *         in: body
 *         required: true
 *         type: object
 *         example: {
 *              name: Bottle,
 *              price: 12.75,
 *              category: GLASS
 *          }
 *     responses:
    *          '200':
    *              description: Get a product for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          id: 1,
    *                          price: 12.75,
    *                          name: Bottle,
    *                          category: GLASS
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
  productRouter.post('/', (req, res) => {
    console.log("Creating new product.");
    console.log(req.body);
    const {price, name, category} = req.body;
    (async () => {
       const productId = await insertProduct(price, name);
       res.send(`Product created with productId ${productId}`);
    })()
  });


  module.exports = productRouter;
  