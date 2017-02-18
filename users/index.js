'use strict';

const crypto = require('crypto');
const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

const tablename = 'tonejudge_users';

function hashAndPut(event, done) {
    const salt = crypto.randomBytes(128).toString('base64');
    crypto.pbkdf2(event.password, salt, 1000, 256, 'sha256',
        (err, key) => {
            if (err) done(err);
            else put(event, done, key.toString('base64'), salt);
        }
    );
}

function get(event, callback) {
    db.get(
        {
            'TableName' : tablename,
            'Key' : {
                'email' : event.email
            }
        }, callback
    );
}

function register(event, done) {
    get(event,
        (err, data) => {
            if (err) done(err);
            else if (data.Item) done('There is already a user registered with that email.');
            else hashAndPut(event, done);
        }
    );
}

function authenticate(event, done) {
    get(event,
        (err, data) => {
            if (err) done(err);
            else if (!data.Item) done('Invalid email or password.');
            else verifyHash(event, done, data.Item);
        }
    );
}

function verifyHash(event, done, item) {
    crypto.pbkdf2(event.password, item.salt, 1000, 256, 'sha256',
        (err, key) => {
            if (err) done(err);
            else if (key.toString('base64') == item.hash) done(null, {});
            else done('Invalid email or password');
        }
    );
}

function put(event, done, hash, salt) {
    db.put(
        {
            'TableName' : tablename,
            'Item' : {
                'email' : event.email,
                'hash' : hash,
                'salt' : salt,
            }
        },
        (err, data) => {
            if (err) done(err);
            else done(null, {});
        }
    );
}

exports.handler = (event, context, done) => {
    if (!event.action || !event.email || !event.password) done("Arguments 'action', 'email', and 'password' are required.");
    else if (event.action == 'register') register(event, done);
    else if (event.action == 'authenticate') authenticate(event, done);
    else done("Unsupported action.");
};
