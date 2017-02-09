'use strict';

const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

const tablename = 'tonejudge_results';

function publish(event, done) {
    if (!event.email || !event.tones || !event.text) done("Arguments 'email', 'text, and 'tones' are required.");
}

function top(event, done) {
    if (!event.tone) done("Argument 'tone' is required.");
}

exports.handler = (event, context, done) => {
    if (!event.action) done("Argument 'action' is required.");
    if (event.action == "publish") publish(event, done);
    if (event.action == "top") top(event, done);
    else done("Unsupported action.");
};
