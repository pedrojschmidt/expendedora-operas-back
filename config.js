var config = {};

config.debug = process.env.DEBUG || true;

config.mqtt  = {};
config.mqtt.namespace = process.env.MQTT_NAMESPACE || '#';
// config.mqtt.hostname  = process.env.MQTT_HOSTNAME  || '172.31.86.248';
config.mqtt.hostname  = process.env.MQTT_HOSTNAME  || '54.234.75.47';
config.mqtt.port      = process.env.MQTT_PORT      || 1883;

config.mongodb = {};
// config.mongodb.hostname   = process.env.MONGODB_HOSTNAME   || 'localhost';
config.mongodb.hostname   = process.env.MONGODB_HOSTNAME   || '127.0.0.1'; // esto me lo dijo chat gpt:
//Dado que el error sugiere un problema de conexión en ::1:27017,
// que es la dirección IPv6 de localhost,
// podrías intentar cambiar la configuración de conexión a la dirección IPv4 específicamente.
// Para ello, puedes modificar la línea donde defines mongoUri de la siguiente manera:
// var mongoUri = 'mongodb://127.0.0.1:' + config.mongodb.port + '/' + config.mongodb.database;
config.mongodb.port       = process.env.MONGODB_PORT       || 27017;
config.mongodb.database   = process.env.MONGODB_DATABASE   || 'test';
config.mongodb.collection = process.env.MONGODB_COLLECTION || 'message';

module.exports = config;
