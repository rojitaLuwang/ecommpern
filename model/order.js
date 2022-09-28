//const { Client } = require('pg');
const express = require('express');
const orderRouter = express.Router();
const client = require('../utils/queries');
const isAuthorized = require('../utils/isAuthorized');

// const client = new Client()
// client.connect()
orderRouter.use(isAuthorized);

is_exists_order_query = {
  name: 'check-if-order-exists-by-customer-id',
  text: `SELECT MAX(id) id FROM "order" WHERE customer_id = $1 AND status = 'DRAFT'`,
}

order_completed_query = {
    name: 'get-order-by-id',
    // text: `SELECT * FROM "order" WHERE id = $1 AND status = 'COMPLETED'`,
    // text: `select p.*, op.quantity count, op.quantity * p.price_per_unit cost 
    // from  product p, order_product op,"order" o 
    // where op.order_id = o.id and p.id = op.product_id and o.customer_id = $1 and o.status = 'COMPLETED'`,
    text: `select o.id oid, o.completed orderdate, sum(op.quantity * p.price_per_unit) totalcost
    from  product p, order_product op,"order" o 
    where op.order_id = o.id and p.id = op.product_id and o.customer_id = $1 and o.status = 'COMPLETED'
	group by o.id`,
  };

order_current_query = {
    name: 'get-order-by-customer_id',
    // text: `SELECT * FROM "order" WHERE id = $1 AND status = 'DRAFT'`,
    text: `select p.*, op.quantity count, op.quantity * p.price_per_unit cost 
    from  product p, order_product op,"order" o 
    where op.order_id = o.id and p.id = op.product_id and o.customer_id = $1 and o.status = 'DRAFT'`,
  };

insert_order_query = {
    name: 'insert-new-order',
    text: 'INSERT INTO "order"(customer_id, created, status) VALUES ($1, CURRENT_TIMESTAMP, \'DRAFT\') returning id',
};

update_order_query = {
    name: 'update-order-by-id',
    text: 'UPDATE "order" SET status = $1 WHERE id = $2',
};

complete_order_query = {
    name: 'complete-order-by-id',
    text: 'UPDATE "order" SET completed = CURRENT_TIMESTAMP WHERE id = $1',
};

delete_order_cart_query = {
  name: 'delete-cart-by-order_id',
  text: 'DELETE FROM "order_product" WHERE order_id = $1',
};

checkIfOrderExists = async function(customerId){
  is_exists_order_query['values'] = [customerId];
  const res = await client.query(is_exists_order_query);
  // if (res.rows[0].id == null) return JSON.stringify({});
  // console.log(`>>> Order Number found: ${res.rows[0]}`);
  return res.rows[0];
}

getCompletedOrderInfo = async function (customerId){
    order_completed_query['values'] = [customerId];
    const res = await client.query(order_completed_query);
    const rows = res.rows;
    // if(res.rowCount === 0) return JSON.stringify([])
    return JSON.stringify(rows);
    // return rows;
};

getCurrentOrderInfo = async function (customerId){
  order_current_query['values'] = [customerId];
  const res = await client.query(order_current_query);
  const rows = res.rows;
  
  //return JSON.stringify(rows[0]);
  return rows;
};

insertOrder = async function(customerId){
    insert_order_query['values'] = [customerId];
    const res = await client.query(insert_order_query);
    const rows = res.rows;
    console.log('New Order inserted with id : ' + rows[0].id);
    return rows[0];
};
completeOrder = async function(orderId){
    complete_order_query['values'] = [orderId];
    const res = await client.query(complete_order_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

deleteOrderProduct = async function(orderId){
  delete_order_cart_query['values'] = [orderId];
  const res = await client.query(delete_order_cart_query);
  const rows = res.rows;
  return JSON.stringify(rows);
}

updateOrder = async function(orderId, status){
    update_order_query['values'] = [status, orderId];
    const res = await client.query(update_order_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     tags:
 *       - Order
 *     description: Get an order for a given id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Order's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get an order for the given id
    *              content:
    *                  'application/json':
    *                      example: {
    *                          name: bottle,
    *                          count: 2,
    *                          cost: 25.50
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
orderRouter.get('/customer/:id', (req, res) => {
    (async () => {
      const completed = await getCompletedOrderInfo(req.params.id);
      console.log(`Completed Orders: ${completed}`);
      if(completed.rowCount > 0){
        res.send(completed);
      }
      res.send(JSON.stringify([]));
    })()
    
  });

orderRouter.get('/customer/check/:id', (req, res) => {
    // console.log("Check if cart exists " + req.params.id);
    (async () => {
      const check = await checkIfOrderExists(req.params.id);
      console.log(`Check order exists: ${check}`);
      if(check.id !== NULL){
        res.send(JSON.stringify(check));
      }
      res.send(JSON.stringify({}));
    })()
    
  });

orderRouter.post('/current/customer', (req, res) => {
    console.log("Fetching current order " + req.params.id);
    (async () => {
      res.send(await getCurrentOrderInfo(req.params.id));
    })()
    
  });
 
  /**
 * @swagger
 * /order/{id}:
 *   delete:
 *     tags:
 *       - Order
 *     description: delete an order
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Order's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Delete an order
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
  orderRouter.delete('/:id', (req, res) => {
    console.log("Deleting order  " + req.params.id);
    (async () => {
        await updateOrder(req.params.id, 'DELETED');
        await completeOrder(req.params.id);
        await deleteOrderProduct(req.params.id);
        res.send(`Order ${req.params.id} Deleted`);
    })()
    
  });

  /**
 * @swagger
 * /order/{id}:
 *   put:
 *     tags:
 *       - Order
 *     description: Update status of an order 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Order's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: status
 *         description: Enter the status to update
 *         in: body
 *         required: true
 *         type: object
 *     responses:
    *          '200':
    *              description: Update status of an order
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
  orderRouter.put('/:id', (req, res) => {
    console.log("Updating order  " + req.params.id);
    const body = req.body;
    (async () => {
        await updateOrder(req.params.id, body.status);
        if (body.status == 'COMPLETED'){
            await completeOrder(req.params.id);
        }
       res.send(`Order ${req.params.id} updated..`);
    })()
    
  });
  /**
 * @swagger
 * /order/{id}:
 *   post:
 *     tags:
 *       - Order
 *     description: Insert an order 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: customer_id
 *         description: Enter the customer id
 *         in: body
 *         required: true
 *         type: object
 *     responses:
    *          '200':
    *              description: Enter a new order for a customer
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

orderRouter.post('/', (req, res) => {

    // console.log("Creating new order." + JSON.stringify(req.body));
    const customerId = req.body.customerId;
    let orderNo;
    (async () => {
        orderNo = await checkIfOrderExists(customerId);
        console.log(`>>>Current order id: ${orderNo.id} for customer id: ${customerId}`);
        if(!orderNo.id){
          orderNo = await insertOrder(customerId);
          console.log(`>>>>New order id: ${orderNo.id} for customer id ${customerId}`)
        }
          res.send(orderNo);
        
    })()
  });



  module.exports = orderRouter;
  