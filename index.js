const express = require('express');
const cors = require('cors');

const app = express();
const port = 8000;

app.use(cors(
    {
        origin: '*',
    }
));

app.get('/', (req, res) => {
    res.send('¡Hola, mundo!');
});

app.listen(port, () => {
    console.log('Server listening on port' + port);
})