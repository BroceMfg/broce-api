# broce-api  
Node.js + Express backend API for handling the Broce Mfg. parts ordering system.

includes:

- redis-sessions for authentication and user-role permissions.
- sequelize ORM for PostgreSQL DB.
- Chai + chai-http tests for each route.

### To run:

- Install PostgreSQL for your system at [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

- Install redis for your system at [http://redis.io/](http://redis.io/)

- Clone this git repo, then `cd` into the directory.

- Issue `npm i` to install the necessary npm dependencies.

- Create a `.env` file in the main project directory to hold our global node variables.

  - This file should look like this:

  - ``` POSTGRESQL_LOCAL_DB=broce_parts
    POSTGRESQL_LOCAL_DB=broce_parts
    POSTGRESQL_LOCAL_HOST=localhost
    SESSION_SECRET=%K1TMpLqIymi
    COOKIE_SECRET=1j5F&OJGL7!s
    ```

- Open a new terminal tab and start a local PostreSQL instace. (On Unix systems, the command is `postgres -D /usr/local/var/postgres`)

- Open another terminal tab and start a local redis server instace. (On Unix systems, the command is simply `redis-server`)

- Finally, we can start the API by running `npm run dev` in our main project directory.

- To run tests, run `npm run test` or `npm run test:watch` to have the tests run each time code changes are saved.