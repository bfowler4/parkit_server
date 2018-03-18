const bookshelf = require(`./bookshelf`);

class User extends bookshelf.Model {
  get tableName() { return `users`; }
  get hasTimestamps() { return true; }

  addresses() {
    return this.hasMany(`Address`);
  }

  spaces() {
    return this.hasMany(`Space`);
  }
}

module.exports = bookshelf.model(`User`, User);