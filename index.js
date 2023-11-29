const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const config = require("./config");
const mqtt = require("mqtt");

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


var mqttUri  = 'mqtt://' + config.mqtt.hostname + ':' + config.mqtt.port;
const client = mqtt.connect(mqttUri);

client.on("connect", () => {
    client.subscribe("+", (err) => {
        if (!err) {
            console.log("Client connected");
        }
        console.log("Client connected");
    });
    console.log("Client connected");
});

client.on("message", (topic, message) => {
    // message is Buffer
    console.log(message.toString());
    if (topic === "addStock") {
        addStock(message.toString());
    }
});

const addStock = async (stockValue) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Conexión exitosa a la base de datos');

        const database = client.db(config.mongodb.database);
        const collection = database.collection('compras');

        const additionalStock = parseInt(stockValue); // Convertir el valor a un número si es necesario

        const filter = { tipo: 'stock' };

        const existingStock = await collection.findOne(filter);

        if (existingStock) {
            const updatedStock = existingStock.numero + additionalStock;

            const result = await collection.updateOne(
                filter,
                { $set: { numero: updatedStock } }
            );

            console.log(`Stock actualizado en la base de datos: ${additionalStock}`);
        } else {
            const result = await collection.insertOne({ tipo: 'stock', numero: additionalStock });

            console.log(`Stock agregado a la base de datos con el ID: ${result.insertedId}`);
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    } finally {
        await client.close();
    }
};

app.post('/addStock', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Conexión exitosa a la base de datos');

        const database = client.db(config.mongodb.database);
        const collection = database.collection('compras');

        const additionalStock = req.body.stock; // Suponiendo que recibes la cantidad adicional de stock en el cuerpo de la solicitud

        // Verificar si ya existe un registro de stock en la base de datos
        const existingStock = await collection.findOne({ tipo: 'stock' }); // Podría ser cualquier identificador único para el stock

        if (existingStock) {
            // Si el stock ya existe, actualizar el valor existente sumándole la cantidad adicional
            const updatedStock = existingStock.numero + additionalStock;

            // Actualizar el registro de stock en la base de datos
            const result = await collection.updateOne(
                { tipo: 'stock' },
                { $set: { numero: updatedStock } }
            );

            console.log(`Stock actualizado en la base de datos: ${additionalStock}`);

            res.send('Cantidad adicional de stock agregada correctamente');
        } else {
            // Si el stock no existe, crear un nuevo registro de stock con la cantidad proporcionada
            const result = await collection.insertOne({ tipo: 'stock', numero: additionalStock });

            console.log(`Stock agregado a la base de datos con el ID: ${result.insertedId}`);

            res.send('Stock agregado correctamente');
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al agregar o actualizar el stock en la base de datos');
    } finally {
        await client.close();
    }
});


app.post('/buy', async (req, res) => {
    const client = new MongoClient(url);
    try {
        // Connect to the database
        await client.connect();
        console.log('Conexión exitosa a la base de datos');

        // Access the database and collection
        const database = client.db(config.mongodb.database);
        const collection = database.collection('compras');

        // Suponiendo que tienes un campo 'numero' en tu registro que quieres actualizar
        const filter = { _id: ObjectId('id_del_registro_a_actualizar') };

        // Buscar el registro existente en la base de datos
        const existingRecord = await collection.findOne(filter);

        if (!existingRecord) {
            return res.status(404).send('Registro no encontrado');
        }

        // Restar uno al número existente
        existingRecord.numero -= 1;

        const updateResult = await collection.updateOne(filter, { $set: { numero: existingRecord.numero } });

        console.log(`Registro actualizado: ${updateResult.modifiedCount}`);

        res.send('Número restado correctamente');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al guardar en la base de datos');
    } finally {
        await client.close(); // Cerrar la conexión al finalizar
    }
});

app.get('/getStock', async (req, res) => {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Conexión exitosa a la base de datos');

        const database = client.db(config.mongodb.database);
        const collection = database.collection('compras');

        const filter = { tipo: 'stock' }; // Filtro para buscar el registro de stock

        const existingStock = await collection.findOne(filter);

        if (!existingStock) {
            return res.status(404).send('Registro de stock no encontrado');
        }

        const stock = existingStock.numero; // Obtener el valor de stock

        res.json({ stock });
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al obtener el stock desde la base de datos');
    } finally {
        await client.close();
    }
});



// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Hola, mundo!');
});

app.listen(port, () => {
    console.log('Server listening on port ' + port);
});