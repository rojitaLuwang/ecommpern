const client = require('../utils/queries');
const express = require('express');
const isAuthorized = require('../utils/isAuthorized');
const cardRouter = require('./card');
const cartRouter = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET)
cardRouter.use(isAuthorized);
// const client = new Client()
// client.connect()

cart_query = {
    name: 'get-cart-by-order_id',
    text: `select op.order_id, c.name, p.name, op.quantity from customer c, product p, order_product op,"order" o 
    where op.order_id = o.id and p.id = op.product_id and o.customer_id = c.id and o.id = $1`,
  };

cart_total_by_customer_query = {
    name: 'cart_total_by_customer',
    text: `select max(o.id) id, sum(p.price_per_unit * op.quantity) totalcost from "product"  p , "order_product" op, "order" o where op.product_id = p.id and 
    op.order_id = o.id and o.id = (select max(id) from "order" oi where oi.customer_id = $1)`
  };


cart_items_by_customer_query = {
    name: 'cart_items_by_customer',
    text: `select p.*, op.quantity amount from "product"  p , "order_product" op, "order" o where op.product_id = p.id and 
    op.order_id = o.id and o.id = (select max(id) from "order" oi where oi.customer_id = $1)`
  };


cart_checkout_query = {
    name: 'get-cart-by-id',
    text: `SELECT p.name name, p.price_per_unit unitprice, op.quantity quantity 
      FROM order_product op, "order" o, product p 
      WHERE o.id = $1 
      AND o.id = op.order_id
      AND p.id = op.product_id`
  };

complete_checkout_query = {
    name: 'complete-checkout-by-id',
    text: `UPDATE "order" SET completed = CURRENT_TIMESTAMP, status = 'COMPLETED' WHERE id = $1 returning id, status`,
};

update_cart_query = {
    name: 'update-cart-by-order_id_and_product_id',
    text: `insert into order_product (order_id, product_id, quantity)
      VALUES($1, $2, $3) 
      ON CONFLICT (order_id, product_id) 
      DO 
      UPDATE SET quantity = $3;`
};

increment_cart_item_query = {
  name: 'increment cart item by product id and cart id',
  text: `UPDATE order_product SET quantity = quantity + 1 WHERE order_id = $1 AND product_id = $2 RETURNING *`,
}

decrement_cart_item_query = {
  name: 'decrement cart item by product id and cart id',
  text: `UPDATE order_product SET quantity = quantity - 1 WHERE order_id = $1 AND product_id = $2 RETURNING *`,
}

delete_cart_query = {
    name: 'delete-cart-by-order_id_and_product_id',
    text: 'DELETE FROM "order_product" WHERE order_id = $1 and product_id = $2',
};

getCartInfo = async function (orderId){
    cart_query['values'] = [orderId];
    const res = await client.query(cart_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

getCartTotalByCustomer = async function (customerId){
  cart_total_by_customer_query['values'] = [customerId];
  const res = await client.query(cart_total_by_customer_query);

  if (res.rowCount == 0) return JSON.stringify([]);
  return res.rows[0];
};


getCartItemsByCustomer = async function (customerId){
  cart_items_by_customer_query['values'] = [customerId];
  const res = await client.query(cart_items_by_customer_query);

  if (res.rowCount == 0) return JSON.stringify([]);
  return JSON.stringify(res.rows);
};



getCartCheckoutInfo = async function (orderId){
  cart_checkout_query['values'] = [orderId];
  const res = await client.query(cart_checkout_query);
  return res;
};

getCompleteCheckout = async function (orderId, order, res){
  console.log(`Unit price ${order[0].unitprice* 100}`)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: order.map(({ name, unitprice, quantity }) => {
      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: name,
          },
          unit_amount: unitprice * 100,
        },
        quantity: quantity,
      }
    }),
    mode: "payment",
    // Set a success and cancel URL we will send customers to
    // They are complete urls    
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/error`,
  })
  console.log(`session url ${session.url}`);
  res.json({ url: session.url })
  
};

updateCart = async function(orderId, productId, productCount){
    update_cart_query['values'] = [orderId, productId, productCount];
    const res = await client.query(update_cart_query);
    const rows = res.rows;
    return JSON.stringify(rows);
};

incrementCartItem = async function(cartId, productId){
  increment_cart_item_query['values'] = [cartId, productId];
  const res = await client.query(increment_cart_item_query);
  return JSON.stringify(res.rows[0]);
}

decrementCartItem = async function(cartId, productId){
  decrement_cart_item_query['values'] = [cartId, productId];
  const res = await client.query(decrement_cart_item_query);
  return JSON.stringify(res.rows[0]);
}

deleteCart = async function(orderId, productId){
    delete_cart_query['values'] = [orderId, productId];
    const res = await client.query(delete_cart_query);
    const rows = res.rows;
    return JSON.stringify(rows);
    
};

 /**
 * @swagger
 * /cart/{id}:
 *   get:
 *     tags:
 *       - Cart
 *     description: Get cart details
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: Cart's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Get cart details
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

cartRouter.get('/:id', (req, res) => {
    console.log("Fetching cart info for order_id:  " + req.params.id);
    (async () => {
      res.send(await getCartInfo(req.params.id));
    })()
    
  });
  
  cartRouter.get('/total/customer/:id', (req, res) => {
    
    (async () => {
      const costData = await getCartTotalByCustomer(req.params.id);
      console.log(`Fetching cart total: ${costData.totalcost} for customer id : ${req.params.id} and order ${costData.id}`);
      res.send({id: costData.id, totalCost: costData.totalcost});
    })()
    
  });

  cartRouter.get('/items/customer/:id', (req, res) => {
    console.log("Fetching cart items for customer id:  " + req.params.id);
    (async () => {
      res.send(await getCartItemsByCustomer(req.params.id));
    })()
    
  });
  
   /**
 * @swagger
 * /cart/{id}/checkout:
 *   get:
 *     tags:
 *       - Cart
 *     description: Checkout cart 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: cart's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
    *          '200':
    *              description: Checkout cart
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
  cartRouter.post('/:id/checkout', (req, res) => {
    console.log("Fetching cart checkout info for order_id:  " + req.params.id);
    (async () => {
      const order = await getCartCheckoutInfo(req.params.id);
      console.log(`Order Exists: ${JSON.stringify(order.rows)}`);
      if(order.rowCount > 0){
        await getCompleteCheckout(req.params.id, order.rows, res);
        //res.send(`  Order Total ${data.total} Status ${completedOrder.status} for order ${completedOrder.id}`);
      }else {
        res.send('{}');
      }
     
    })()
    
  });
  
   /**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     tags:
 *       - Cart
 *     description: Delete a product from cart 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: cart's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: product_id
 *         description: Enter the product id
 *         in: body
 *         required: true
 *         type: object
 *     responses:
    *          '200':
    *              description: Delete a product from cart
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
  cartRouter.delete('/item/delete/:productId', (req, res) => {
    // console.log("Deleting cart  " + req.params.id);
    const {userId, cartId, productId} = req.body;
    (async () => {
        res.send(await deleteCart(cartId, productId));
    })()
    
  });

   /**
 * @swagger
 * /cart/{id}:
 *   put:
 *     tags:
 *       - Cart
 *     description: Insert a product for a cart 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: cart's id
 *         in: path
 *         required: true
 *         type: integer
 *       - name: product
 *         description: Enter product id and product count
 *         in: body
 *         required: true
 *         type: object
 *     responses:
    *          '200':
    *              description: Insert new product in a cart
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

cartRouter.put('/item/increment', (req, res) => {
      const {userId, cartId, productId} = req.body;
      console.log(`**** Increment cart id: ${cartId} and product id: ${productId}`);
      (async () => {
          res.send(await incrementCartItem(cartId, productId));
      })()
      
    });

cartRouter.put('/item/decrement', (req, res) => {
      const {userId, cartId, productId} = req.body;
      console.log(`**** Decrement cart id: ${cartId} and product id: ${productId}`);
      (async () => {
          res.send(await decrementCartItem(cartId, productId));
      })()
      
    });



  cartRouter.post('/items/add/:cart_id', (req, res) => {
    const {user_id, product_id, product_count} = req.body;
    console.log(`Before insert ${req.params.cart_id} product ${product_id} count ${product_count}`);
    (async () => {
        const insertedItem = await updateCart(req.params.cart_id, product_id, product_count);
        console.log(`Inserted Item: ${insertedItem}`);
        res.send(insertedItem);
    })()
    
  });
  
 
  module.exports = cartRouter;
  
