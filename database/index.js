const sqlite3 = require('sqlite3').verbose();

const DATABASE_SCHEMA = `
    CREATE TABLE IF NOT EXISTS actors (
        id integer(11) NOT NULL PRIMARY KEY,
        login varchar(255) NOT NULL UNIQUE,
        avatar_url varchar(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
        id integer(11) NOT NULL PRIMARY KEY,
        type varchar(40) NOT NULL,
        created_at datetime,
        actor_id integer(11),
        repo_id integer(11)
    );
    CREATE TABLE IF NOT EXISTS repos (
        id integer(11) NOT NULL PRIMARY KEY,
        name varchar(255) NOT NULL,
        url varchar(255) NOT NULL,
        actor_id integer(11)
    );`;

/**
 * Connect to database and setup tables if they do not exist
 */
exports.connect = () => {
    return new sqlite3.Database(`${__dirname}/database.sqlite`, function (err) {
        if (err) { throw new Error(err); }
        console.log('Connected to kelvin dbs 1.');
        this.exec(DATABASE_SCHEMA, (err) => {
            if (err) { throw new Error(err) }
            console.log('Connected to kelvin dbs 2.');
        });
    });
};
