
exports.up = function(knex, Promise) {
  return knex.schema.createTable(`addresses`, (table) => {
    table.increments();
    table.string(`street`).notNullable();
    table.string(`apartment_number`);
    table.string(`city`).notNullable();
    table.string(`state`).notNullable();
    table.integer(`zipcode`).notNullable();
    table.integer(`user_id`).references(`id`).inTable(`users`);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable(`addresses`);
};
