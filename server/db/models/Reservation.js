const bookshelf = require(`./bookshelf`);

class Reservation extends bookshelf.Model {
  get tableName() { return `reservations`; }
  get hasTimestamps() { return false; }

  user() {
    return this.belongsTo(`User`);
  }

  space() {
    return this.belongsTo(`Space`);
  }
}

module.exports = bookshelf.model(`Reservation`, Reservation);