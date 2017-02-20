'use strict';

const crypto = require('crypto');
const mysql = require('mysql');

let connection;

const TABLE_NAME = 'users';

function register(event, done) {
    const salt = crypto.randomBytes(128).toString('base64');
    crypto.pbkdf2(event.password, salt, 1000, 256, 'sha256',
        (err, key) => {
            if (err) done(err);
            else put(event, done, key.toString('base64'), salt);
        }
    );
}

function authenticate(event, done) {
    connection.query('SELECT * FROM ?? WHERE `email` = ?', [TABLE_NAME, event.email],
        (err, results, fields) => {
            if (err) done(err);
            else if (results.length === 0) done('Invalid email or password.');
            else verifyHash(event, done, results[0]);
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
    connection.query("INSERT INTO ?? SET ?", [TABLE_NAME,
            {
                "email" : event.email,
                "hash" : hash,
                "salt" : salt
            }],
        (err, results, fields) => {
            if (err) {
                if(err.code === "ER_DUP_ENTRY") done ('There is already a user registered with that email.');
                else done(err);
            }
            else done(null, {});
        }
    );
}

exports.handler = (event, context, end) => {
    connection = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
    const done = (err, msg) => {
        connection.end();
        end(err, msg);
    };
    if (!event.action || !event.email || !event.password) done("Arguments 'action', 'email', and 'password' are required.");
    else if (event.action == 'register') register(event, done);
    else if (event.action == 'authenticate') authenticate(event, done);
    else done("Unsupported action.");
};

