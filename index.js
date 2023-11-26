const express = require('express');
const cors = require('cors');

const app = express();
const port = 8000;

app.use(cors(
    {
        origin: '*',
    }
))

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

app.get('/', (req, res) => {
    res.send('¡Hola, mundo!');
})

app.post('/buy', (req, res) => {
    console.log('Buy ' + req.body.topic);
    res.send(req.body.topic + ' bought');
})

app.listen(port, () => {
    console.log('Server listening on port ' + port);
})