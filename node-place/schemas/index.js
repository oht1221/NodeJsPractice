const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV, DB_NAME } = process.env;
const MONGO_URL = `mongodb+srv://${MONGO_ID}:${MONGO_PASSWORD}@testdb.mzrxx.gcp.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;

module.exports = () => {
    const connect = () => {
        if (NODE_ENV !== 'production'){
            mongoose.set('debug', true);
        }
        mongoose.connect(MONGO_URL, {
            dbName: 'nodeplace'
        }, (error) => {
            if(error){
                console.log('mongo db connection error!', error);
            }
            else{
                console.log('mongo db connection eastablished!')
            }
        });
    };

    connect();

    mongoose.connection.on('error', (error) => {
        console.error('mongodb connection error!', error);
    });

    mongoose.connection.on('disconnected', () => {
        console.error('mongo db connection lost. Trying to reconnect...');
        connect();
    });

    require('./favorite');
    require('./history');
};