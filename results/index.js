'use strict';

const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

const tablename = 'tonejudge_results';

function publish(event, done) {
    if (!event.email || !event.text) done("Arguments 'email' and 'text' are required.");
    if (!event.anger) event.anger = 0.0;
    if (!event.disgust) event.disgust = 0.0;
    if (!event.fear) event.fear = 0.0;
    if (!event.joy) event.joy = 0.0;
    if (!event.sadness) event.sadness = 0.0;
    if (!event.analytical) event.analytical = 0.0;
    if (!event.confident) event.confident = 0.0;
    if (!event.tentative) event.tentative = 0.0;
    if (!event.openness_big5) event.openness_big5 = 0.0;
    if (!event.conscientiousness_big5) event.conscientiousness_big5 = 0.0;
    if (!event.extraversion_big5) event.extraversion_big5 = 0.0;
    if (!event.agreeableness_big5) event.agreeableness_big5 = 0.0;
    if (!event.emotional_range_big5) event.emotional_range_big5 = 0.0;
    db.put(
        {
            "TableName" : tablename,
            "ConditionExpression" : "attribute_not_exists(#t)",
            "ExpressionAttributeNames" : {
                "#t" : "text"
            },
            "Item" : {
                "text" : event.text,
                "email" : event.email,
                "anger" : event.anger,
                "disgust" : event.disgust,
                "fear" : event.fear,
                "joy" : event.joy,
                "sadness" : event.sadness,
                "analytical" : event.analytical,
                "confident" : event.confident,
                "tentative" : event.tentative,
                "openness_big5" : event.openness_big5,
                "conscientiousness_big5" : event.conscientiousness_big5,
                "extraversion_big5" : event.extraversion_big5,
                "agreeableness_big5" : event.agreeableness_big5,
                "emotional_range_big5" : event.emotional_range_big5
            }
        },
        (err, data) => {
            if (err) {
                if (err.name == 'ConditionalCheckFailedException') done("Text has already been submitted.");
                else done(err);
            }
            else done(null, {});
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
