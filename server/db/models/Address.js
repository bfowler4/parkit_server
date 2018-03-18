const bookshelf = require(`./bookshelf`);

class Address extends bookshelf.Model {
  get tableName() { return `addresses`; }
  get hasTimestamps() { return false; }

  user() {
    return this.belongsTo(`User`);
  }

  spaces() {
    return this.hasMany(`Space`);
  }
}

module.exports = bookshelf.model(`Address`, Address);

