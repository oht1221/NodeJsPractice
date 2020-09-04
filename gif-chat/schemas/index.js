const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV, DB_NAME } = process.env;
const MONGO_URL = `mongodb+srv://${MONGO_ID}:${MONGO_PASSWORD}@testdb.mzrxx.gcp.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;

module.exports = () => {
    const connect = () => {
        if(NODE_ENV !== 'production'){
            mongoose.set('debug', true);
        }
        mongoose.connect(MONGO_URL, {
            dbName: 'gifchat'
        }, (error) => {
            if (error) console.log('Mongo DB connection error!');
            else console.log('Mongo DB connection success!');
        });
    };
    connect();

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error', error);
    });
    mongoose.connection.on('disconnected', () => {
        console.error('MongoDB connection has been disconnected. Tyring to reconnect...');
        connect();
    });

    require('./chat');
    require('./room');
};