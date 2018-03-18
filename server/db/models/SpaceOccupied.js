const bookshelf = require(`./bookshelf`);

class SpaceOccupied extends bookshelf.Model {
  get tableName() { return `spaces_occupied`; }
  get hasTimestamps() { return false; }

  space() {
    return this.belongsTo(`Space`);
  }
}

module.exports = bookshelf.model(`SpaceOccupied`, SpaceOccupied);