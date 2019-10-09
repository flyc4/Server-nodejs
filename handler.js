// handler.js
'use strict';
const express = require('express');
const serverless = require('serverless-http');
const db_url = `mongodb+srv://lambdauser:lambdauser@cluster0-inakp.mongodb.net/admin?retryWrites=true&w=majority`;
const MongoClient = require("mongodb").MongoClient;
const BodyParser = require("body-parser"); 
const app = express();

const client = new MongoClient(db_url, {
    useNewUrlParser: true,
});
let db,collection;

const createConn = async () => {
    await client.connect();
    db = client.db('db');
    collection = db.collection('users')
}; 

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(BodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(BodyParser.json())

app.listen(3000, () => {
    console.info(`Listening on port 3000.`);
});

app.get('/hello', async function (req, res) {
    if (!client.isConnected()) {
        // Cold start or connection timed out. Create new connection.
        try {
            await createConn();
        } catch (e) {
            res.json({
                error: e.message,
            });
            return;
        }
    }
    // Connection ready. Perform insert and return result.
    try {
        collection.findOne({},function(err,data){ 
            res.json(data)
            return
        })

    } catch (e) {
        res.send({
            error: e.message,
        });
        return;
    }
}); 

app.post('/hello_insert', async function (req, res) {
    if (!client.isConnected()) {
        // Cold start or connection timed out. Create new connection.
        try {
            await createConn();
        } catch (e) {
            res.json({
                error: e.message,
            });
            return;
        }
    }
    // Connection ready. Perform insert and return result.
    try {
        const paramName = req.body.name;
        console.log("paramName: ",paramName)
        collection.insertOne({name: paramName},function(err,data){  
        res.json({"insert": "end"}) 
        res.end()
        return
        })

    } catch (e) {
        res.send({
            error: e.message,
        });
        return;
    }
}); 

app.delete('/hello_delete', async function (req, res) {
    
    if (!client.isConnected()) {
        // Cold start or connection timed out. Create new connection.
        try {
            await createConn();
        } catch (e) {
            res.json({
                error: e.message,
            });
            return;
        }
    } 
    
    // Connection ready. Perform insert and return result.
    try {
        const paramName = req.body.name;
        console.log("paramName: ",paramName)
        collection.deleteOne({name: paramName},function(err,data){  
        res.json({"delete": "end"}) 
        res.end()
        return
        })

    } catch (e) {
        res.send({
            error: e.message,
        });
        return;
    }
});

app.put('/hello_update', async function (req, res) {
    
    if (!client.isConnected()) {
        // Cold start or connection timed out. Create new connection.
        try {
            await createConn();
        } catch (e) {
            res.json({
                error: e.message,
            });
            return;
        }
    } 
    
    // Connection ready. Perform insert and return result.
    try {
        const paramName = req.body.name;
        console.log("paramName: ",paramName)
        collection.updateOne({name: "test"},{$set: {name: paramName}},function(err,data){  
        res.json({"update": "end"}) 
        res.end()
        return
        })

    } catch (e) {
        res.send({
            error: e.message,
        });
        return;
    }
});

module.exports = {
    app 
} 
module.exports.handler = serverless(app) 

