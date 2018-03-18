
exports.up = function(knex, Promise) {
  return knex.schema.createTable(`reservations`, (table) => {
    table.increments();
    table.timestamp(`time_requested`);
    table.timestamp(`start_time`);
    table.timestamp(`end_time`);
    table.integer(`duration`);
    table.integer(`user_id`).references(`id`).inTable(`users`);
    table.integer(`space_id`).references(`id`).inTable(`spaces`);
    table.timestamp(`created_at`).defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(`reservations`);
};
