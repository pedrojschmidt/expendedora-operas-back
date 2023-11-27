const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const config = require("./config");

const app = express();
const port = 8000;

app.use(cors(
    {
        origin: '*',
    }
))

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

// URL de conexión a tu base de datos local de MongoDB
const url = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port + '/' + config.mongodb.database;

app.post('/buy', async (req, res) => {
    const client = new MongoClient(url);
    try {
        // Connect to the database
        await client.connect();
        console.log('Conexión exitosa a la base de datos');

        // Access the database and collection
        const database = client.db(config.mongodb.database);
        const collection = database.collection('compras');

        const topic = req.body.topic;

        // Create a document to insert
        const doc = {
            content: topic + ' bought',
        };

        // Insert the defined document into the collection
        const result = await collection.insertOne(doc);

        // Print the ID of the inserted document
        console.log(`A document was inserted with the _id: ${result.insertedId}`);

        res.send(topic + ' bought');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al guardar en la base de datos');
    } finally {
        await client.close(); // Cerrar la conexión al finalizar
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Hola, mundo!');
});

app.listen(port, () => {
    console.log('Server listening on port ' + port);
});