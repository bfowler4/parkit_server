const bookshelf = require(`./bookshelf`);

class SpaceInReview extends bookshelf.Model {
  get tableName() { return `spaces_in_review`; }
  get hasTimestamps() { return false; }

  space() {
    return this.belongsTo(`Space`);
  }
}

module.exports = bookshelf.model(`SpaceInReview`, SpaceInReview);