//const { Client } = require('pg');
const express = require('express');
const bcrypt = require("bcryptjs");
const client = require('../utils/queries');

// const bodyParser = require('body-parser');
const registerRouter = express.Router();

const nameExists = async (name) => {
    const data = await client.query("SELECT * FROM customer WHERE name=$1", [
      name,
    ]);
    if (data.rowCount === 0) return false;
    return data.rows[0];
  };

const createUser = async (name, email, password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const data = await client.query(
      "INSERT INTO customer(name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, password",
      [name,email,hash]
    );
   
    if (data.rowCount == 0) return null;
    return data.rows[0];
  };

  const createGoogleUser = async (name, email, googleUserId) => {
    const data = await client.query(
      "INSERT INTO customer(name, email, password, oauth2_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, oauth2_id",
      [name,email,'-', googleUserId]
    );
   
    if (data.rowCount == 0) return null;
    return data.rows[0];
  };  

const matchPassword = async (password, hashPassword) => {
    const match = await bcrypt.compare(password, hashPassword);
    return match
  };


  module.exports = {nameExists, createUser, matchPassword, createGoogleUser};