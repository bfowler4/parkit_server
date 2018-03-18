const knex = require(`../knex`);
const bookshelf = require(`bookshelf`)(knex);
const postgis = require(`bookshelf-postgis`);
bookshelf.plugin(`registry`);
bookshelf.plugin(postgis);

module.exports = bookshelf;