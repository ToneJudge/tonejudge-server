'use strict';

const crypto = require('crypto');
const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

const tablename = 'tonejudge_users';

const hashAndPut = function (event, done) {
    const salt = crypto.randomBytes(128).toString('base64');
    crypto.pbkdf2(event.password, salt, 1000, 256, 'sha256',
        (err, key) => {
            if (err) done(err, err.stack);
            put(event, done, key.toString('base64'), salt);
        }
    );
};

const get = function (event, callback) {
    db.get(
        {
            'TableName' : tablename,
            'Key' : {
                'email' : event.email
            }
        }, callback);
};

const register = function(event, done) {
    get(event,
        (err, data) => {
            if (err) done(err, err.stack);
            else if (data.Item) done('There is already a user registered with that email.');
            else hashAndPut(event, done);
        }
    );
};

const authenticate = function(event, done) {
    get(event,
        (err, data) => {
            if (err) done(err, err.stack);
            else if (!data.Item) done('Invalid email or password.');
            else verifyHash(event, done, data.Item);
        }
    );
};

const verifyHash = function (event, done, item) {
    crypto.pbkdf2(event.password, item.salt, 1000, 256, 'sha256',
        (err, key) => {
            if (err) done(err, err.stack);
            else if (key.toString('base64') == item.hash) done(null, {});
            else done('Invalid email or password');
        }
    );
};

const put = function (event, done, hash, salt) {
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
            if (err) done(err, err.stack);
            else done(null, {});
        }
    );
};

exports.handler = (event, context, done) => {
    if (!event.action || !event.email || !event.password) done("Arguments 'action', 'email', and 'password' are required.");

    if (event.action == 'register') register(event, done);
    else if (event.action == 'authenticate') authenticate(event, done);
    else done("Unsupported action.");
};
