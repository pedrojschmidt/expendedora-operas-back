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
// const url = 'mongodb://54.87.254.108:27017/vending_machine';

var mqttUri  = 'mqtt://' + config.mqtt.hostname + ':' + config.mqtt.port;
const mqttClient = mqtt.connect(mqttUri);

mqttClient.on("connect", () => {
    mqttClient.subscribe("+", (err) => {
        if (!err) {
            console.log("Client connected");
        }
        console.log("Client connected");
    });
    console.log("Client connected");
});

mqttClient.on("message", (topic, message) => {
    // message is Buffer
    console.log(message.toString());
    if (topic === "OPERAS_originals_addStock") {
        addStock("stock_originals", message.toString());
    }
    else if (topic === "OPERAS_chocolate_addStock") {
        addStock("stock_chocolate", message.toString());
    }
    else if (topic === "OPERAS_strawberry_addStock") {
        addStock("stock_strawberry", message.toString());
    }
    else if (topic === "MACHINE_inService") {
        const messageBoolean = message.toString().toLowerCase() === "true";
        updateService(messageBoolean);
    }
});

const updateService = async (newState) => {
    const client = new MongoClient(url);
    const type = "inService";
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        const filter = { type: type };

        const inService = await collection.findOne(filter);

        if (inService) {
            const result = await collection.updateOne(
                filter,
                { $set: { state: newState } }
            );

            console.log(`${type} actualizado en la base de datos: ${newState}`);
        } else {
            const result = await collection.insertOne({ type: type, state: false });

            console.log(`${type} agregado a la base de datos con el ID: ${result.insertedId}`);
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    } finally {
        await client.close();
    }
};

const addStock = async (type, stockValue) => {
    const client = new MongoClient(url);
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        const additionalStock = parseInt(stockValue); // Convertir el valor a un número si es necesario

        const filter = { type: type };

        const existingStock = await collection.findOne(filter);

        if (existingStock) {
            const updatedStock = existingStock.number + additionalStock;

            const result = await collection.updateOne(
                filter,
                { $set: { number: updatedStock } }
            );

            console.log(`${type} actualizado en la base de datos: +${additionalStock}u`);
        } else {
            const result = await collection.insertOne({ type: type, number: additionalStock });

            console.log(`${type} agregado a la base de datos con el ID: ${result.insertedId}`);
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    } finally {
        await client.close();
    }
};

app.get('/checkMachineOpen', async (req, res) => {
    const client = new MongoClient(url);
    const type = "machineOpen";
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        // Verificar si ya existe un registro de inService en la base de datos
        const existingIsOpen = await collection.findOne({ type: type });

        if (existingIsOpen) {
            res.send({ isMachineOpen: existingIsOpen.state});
        } else {
            // Si el inService no existe, crear un nuevo registro de inService con el estado en false
            const result = await collection.insertOne({ type: type, state: false });

            console.log(`${type} agregado a la base de datos con el ID: ${result.insertedId}`);

            res.send({ isMachineOpen: false });
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al obtener el estado de la máquina');
    } finally {
        await client.close();
    }
})

app.get('/checkService', async (req, res) => {
    const client = new MongoClient(url);
    const type = "inService";
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        // Verificar si ya existe un registro de inService en la base de datos
        const existingInService = await collection.findOne({ type: type });

        if (existingInService) {
            res.send({ inService: existingInService.state});
        } else {
            // Si el inService no existe, crear un nuevo registro de inService con el estado en false
            const result = await collection.insertOne({ type: type, state: false });

            console.log(`${type} agregado a la base de datos con el ID: ${result.insertedId}`);

            res.send({ inService: false });
        }
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send('Error al obtener el estado del servicio de la máquina');
    } finally {
        await client.close();
    }
})

app.post('/addStock', async (req, res) => {
    const client = new MongoClient(url);
    const type = req.body.type;
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        const additionalStock = req.body.stock; // Suponiendo que recibes la cantidad adicional de stock en el cuerpo de la solicitud

        // Verificar si ya existe un registro de stock en la base de datos
        const existingStock = await collection.findOne({ type: type }); // Podría ser cualquier identificador único para el stock

        if (existingStock) {
            // Si el stock ya existe, actualizar el valor existente sumándole la cantidad adicional
            const updatedStock = existingStock.number + additionalStock;

            // Actualizar el registro de stock en la base de datos
            const result = await collection.updateOne(
                { type: type },
                { $set: { number: updatedStock } }
            );

            console.log(`${type} actualizado en la base de datos: +${additionalStock}u`);

            res.send('Cantidad adicional de stock agregada correctamente');
        } else {
            // Si el stock no existe, crear un nuevo registro de stock con la cantidad proporcionada
            const result = await collection.insertOne({ type: type, number: additionalStock });

            console.log(`${type} agregado a la base de datos con el ID: ${result.insertedId}`);

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
    const type = req.body.type;
    const topic = req.body.topic;
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        const filter = { type: type }; // Filtro para obtener el registro de stock

        const existingStock = await collection.findOne(filter);

        if (!existingStock) {
            return res.status(404).send('Registro de stock no encontrado');
        }

        // Restar uno al número de stock
        existingStock.number -= 1;

        const updateResult = await collection.updateOne(
            filter,
            { $set: { number: existingStock.number } }
        );

        console.log(`${type} actualizado en la base de datos: -${updateResult.modifiedCount}u`);

        // Publicar un mensaje genérico en el topic proporcionado en req.body.topic
        mqttClient.publish(topic, 'Compra realizada');

        res.send('Número restado correctamente al stock');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send(`Error al restar el número al ${type} en la base de datos`);
    } finally {
        await client.close();
    }
});


app.post('/getStock', async (req, res) => {
    const client = new MongoClient(url);
    const type = req.body.type;
    try {
        await client.connect();

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.collection);

        const filter = { type: type }; // Filtro para buscar el registro de stock

        const existingStock = await collection.findOne(filter);

        if (!existingStock) {
            return res.status(404).send('Registro de stock no encontrado');
        }

        const stock = existingStock.number; // Obtener el valor de stock

        res.json({ stock });
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        res.status(500).send(`Error al obtener el ${type} desde la base de datos`);
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