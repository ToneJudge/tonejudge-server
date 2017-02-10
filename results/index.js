'use strict';

const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

const tablename = 'tonejudge_results';

function get(event, callback) {
    db.get(
        {
            "TableName" : tablename,
            "text" : event.text
        }, callback
    )
}

function put(event, done) {
    db.put(
        {
            "TableName" : tablename,
            "Item" : {
                "text" : event.text,
                "email" : event.email
                //
            }
        },
        (err, data) => {
            if (err) done(err, err.stack);
            else done(null, {});
        }
    )
}

function publish(event, done) {
    if (!event.email || !event.tones || !event.text) done("Arguments 'email', 'text, and 'tones' are required.");
    get(event,
        (err, data) => {
            if (err) done(err, err.stack);
            else if (data.Item) done("Text has already been published.");
            else put(event, done);
        }
    );
}

function top(event, done) {
    if (!event.tone) done("Argument 'tone' is required.");
}

exports.handler = (event, context, done) => {
    if (!event.action) done("Argument 'action' is required.");
    else if (event.action == "publish") publish(event, done);
    else if (event.action == "top") top(event, done);
    else done("Unsupported action.");
};
