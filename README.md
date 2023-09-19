<img align="left" src="https://github.com/ae-utbm/api/assets/49886317/aa7a4e72-e6e4-4a70-bf70-3bb209553214" height="128">

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
git clone --recurse-submodules 'https://github.com/ae-utbm/api.git'

# install dependencies
pnpm install
```

### Database

We are using [PostgreSQL](https://www.postgresql.org/) as our database ecosystem. You can install it on your machine or use a docker container:

<details>
	<summary>Docker</summary>

WIP

</details>

<details>
	<summary>Linux</summary>

WIP

</details>

<details>
	<summary>Windows</summary>

WIP

</details>

<details>
	<summary>MacOS</summary>

The easiest way to install PostgreSQL is to use [Homebrew](https://brew.sh/).

```bash
brew install postgresql@13
brew services start postgresql@13 # start postgresql service
```

Then you can use [pgAdmin](https://www.pgadmin.org/) to create a server with the following parameters:

|      pgAdmin 4       | `.env` variable name | value                                                                                     |
| :------------------: | :------------------: | :---------------------------------------------------------------------------------------- |
|         Host         |      `DB_HOST`       | `127.0.0.1`                                                                               |
|         Port         |      `DB_PORT`       | `5432`                                                                                    |
|       Username       |    `DB_USERNAME`     | Should be the username you used to install postgresql or any user you have created for it |
|       Password       |    `DB_PASSWORD`     | leave it empty, unless you have set a password for your postgresql user                   |
| Maintenance database |    `DB_DATABASE`     | `postgres`                                                                                |

</details>

<br>

> **Warning**  
> Once you have setup the server, create a database with the name you have set in the `.env` file for the `DB_DATABASE` variable.

#### First setup of the database

```bash
# create the database (will drop if already exists and create it again)
pnpm run db:create

# run the seeders (to populate the database with some base data)
pnpm run db:seed
```

## Start the API

The app is built with [NestJS](https://nestjs.com/) and uses [TypeScript](https://www.typescriptlang.org/). You can run it with the following commands:

```bash
# debug mode
pnpm run start:debug

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Run tests

Both unit and e2e tests are available and run with [Jest](https://jestjs.io/). You can run them with the following command:

```bash
# unit tests
pnpm run test
```
