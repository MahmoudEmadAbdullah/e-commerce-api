const mongoose = require('mongoose');

const dbConnection = () => {
    mongoose.connect(process.env.BD_URL).then((conn) => {
        console.log(`Database Connected: ${conn.connection.host}`);
    });
};


module.exports = dbConnection;


