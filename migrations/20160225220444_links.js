exports.up = function (knex, Promise) {
  return knex.schema.createTable('links', function (table) {
    table.increments('id').primary();
    table.string('url');
    table.integer('count').defaultTo(0);
    table.string('shorted').unique();
    table.integer('user_id').references('users.id');
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('links');
};
