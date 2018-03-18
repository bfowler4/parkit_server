
exports.up = function(knex, Promise) {
  return knex.schema.createTable(`spaces_occupied`, (table) => {
    table.increments();
    table.integer(`space_id`).references(`id`).inTable(`spaces`);
    table.timestamp(`end_time`);
    table.timestamp(`created_at`).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(`spaces_occupied`);
};
