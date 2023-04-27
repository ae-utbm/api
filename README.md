<!-- <img align="left" src="https://user-images.githubusercontent.com/49886317/167401362-923cd69b-3beb-4e02-856e-d32872eaa5f4.png" height="128"> -->

# AE UTBM - API

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/XK9WfPsUFm)
[![GitHub issues](https://img.shields.io/github/issues/ae-utbm/api?style=for-the-badge)](https://GitHub.com/ae-utbm/api/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ae-utbm/api?style=for-the-badge)](https://GitHub.com/ae-utbm/api/issues)

<br/>

## Installation

### Project

To run this project, you will need to install [Node.js](https://nodejs.org/en/) and [pnpm](https://pnpm.io/).

```bash
# clone the repository
git clone 'https://github.com/ae-utbm/api.git'

# install dependencies
pnpm install
```

### Database

We are using [PostgreSQL](https://www.postgresql.org/) as our database ecosystem. You can install it on your machine or use a docker container.

#### 🐳 Docker

> TODO

#### 🐧 Linux

> TODO

#### 🪟 Windows

> TODO

####  MacOS

The easiest way to install PostgreSQL is to use [Homebrew](https://brew.sh/).

```bash
brew install postgresql@13
brew services start postgresql@13 # start postgresql service
```

Then you can use [pgAdmin](https://www.pgadmin.org/) to create a server with the following parameters:

|      pgAdmin 4       | `.env` variable name | value                                                                                     |
|:--------------------:|:--------------------:|:------------------------------------------------------------------------------------------|
|         Host         |      `DB_HOST`       | `localhost`                                                                               |
|         Port         |      `DB_PORT`       | `5432`                                                                                    |
|       Username       |    `DB_USERNAME`     | Should be the username you used to install postgresql or any user you have created for it |
|       Password       |    `DB_PASSWORD`     | leave it empty, unless you have set a password for your postgresql user                   |
| Maintenance database |    `DB_DATABASE`     | `postgres`                                                                                |

**Once you have setup the server, create a database with the name you have set in the `.env` file for the `DB_DATABASE` variable.**

## Running the app

As we are using GraphQL, while in development, you can access the GraphQL playground at `http://localhost:3000/graphql`.

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Test

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
