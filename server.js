// import { MongoClient } from "mongodb";
const { MongoClient } = require('mongodb')
// Replace the uri string with your MongoDB deployment's connection string.
var config   = require('./config');
var mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port + '/' + config.mongodb.database;
var date_time = new Date();
// Create a new client and connect to MongoDB
const client = new MongoClient(mongoUri);

async function run() {
    try {
        // Connect to the "insertDB" database and access its "haiku" collection
        const database = client.db(config.mongodb.database);
        const haiku = database.collection("message");

        // Create a document to insert
        const doc = {
//      title: "Record of a Shriveled Datum",
            fecha: date_time,
            content: "No bytes, no problem. Just insert a document, in MongoDB",
        }
        // Insert the defined document into the "haiku" collection
        const result = await haiku.insertOne(doc);

        // Print the ID of the inserted document
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    } finally {
        // Close the MongoDB client connection
        await client.close();
    }
}
// Run the function and handle any errors
run().catch(console.dir);

