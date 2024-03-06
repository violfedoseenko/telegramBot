const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'telega_bot',
    'root',
    'root',
    {
        host: '5.188.128.67',
        port: 5432,
        dialect: 'postgres'
    }
)
