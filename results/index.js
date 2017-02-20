'use strict';

const mysql = require('mysql');

let connection;

const TABLE_NAME = 'results';

const TONES = {
    "anger" : 0.0,
    "disgust" : 0.0,
    "fear" : 0.0,
    "joy" : 0.0,
    "sadness" : 0.0,
    "analytical" : 0.0,
    "confident" : 0.0,
    "tentative" : 0.0,
    "openness_big5" : 0.0,
    "conscientiousness_big5" : 0.0,
    "extraversion_big5" : 0.0,
    "agreeableness_big5" : 0.0,
    "emotional_range_big5" : 0.0
};

const COLUMNS = Object.assign({}, TONES);
COLUMNS.email = null;
COLUMNS.text = null;

function publish(event, done) {
    if (!event.email || !event.text) done("Arguments 'email' and 'text' are required.");
    const row = Object.assign({}, COLUMNS, event);
    for (const k of Object.keys(row)) {
        if (!(k in COLUMNS)) {
            delete row[k];
        }
    }
    connection.query('INSERT INTO ?? SET ?', [TABLE_NAME, row],
        (err, results, fields) => {
            if (err) done(err);
            else done(null, {});
        }
    );
}

function top(event, done) {
    if (!event.tone) done("Argument 'tone' is required.");
    if (!(event.tone in TONES)) done("Invalid argument 'tone'. Must be one of: " + Object.keys(TONES));
    connection.query("SELECT * FROM ??", TABLE_NAME,
        (err, results, fields) => {
            if (err) done(err);
            else done(null, results);
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
    if (!event.action) done("Argument 'action' is required.");
    else if (event.action == "publish") publish(event, done);
    else if (event.action == "top") top(event, done);
    else done("Unsupported action.");
};