<img align="left" src="https://github.com/ae-utbm/api/assets/49886317/aa7a4e72-e6e4-4a70-bf70-3bb209553214" height="128">

# AE UTBM - API

[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/XK9WfPsUFm)
[![GitHub issues](https://img.shields.io/github/issues/ae-utbm/api?style=for-the-badge)](https://GitHub.com/ae-utbm/api/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ae-utbm/api?style=for-the-badge)](https://GitHub.com/ae-utbm/api/issues)

<br/>

This repository contains the source code of the API used by the [Sith 4](https://github.com/ae-utbm/sith4/) to manage its members, events, etc. Feel free to contribute to this project by opening a pull request or an issue.

- **This project is under the [GNU GPLv3](./LICENSE) license.**
- You can find the contributing guidelines [here](./.github/CONTRIBUTING.md).

## Table of contents

- [Installation](#installation)
  - [Project](#project)
  - [Environment variables](#environment-variables)
  - [Database](#database)
    - [PostgreSQL Installation](#postgresql-installation)
    - [Configuration](#configuration)
    - [First time setup](#first-time-setup)
- [Launch](#launch)
- [Tests](#tests)
- [Linting](#linting)
- [Documentation](#documentation)

## Installation

### Project

To run this project, you will need to install [NodeJS](https://nodejs.org/en/) and [pnpm](https://pnpm.io/).

```bash
# install pnpm globally (npm comes with nodeJS)
npm install -g pnpm
```

```bash
# clone the repository
# note: we use --recurse-submodules to clone the types repository as well
git clone --recurse-submodules 'https://github.com/ae-utbm/api.git'

# install the dependencies
pnpm install
```

> **Note**  
> This project use the [typings repository](https://github.com/ae-utbm/typings) as a git submodule to manage output types for all endpoints, this submodule is also present in the [Sith 4](https://github.com/ae-utbm/sith4) and allows to share the types between the two projects.

### Environment variables

The API can be configured trough a lot of environment variables, you can find them in the [`.env.example`](./.env.example) file. You will need to create a `.env` file and fill it with the values you want to use before running the API.

### Database

#### PostgreSQL Installation

<h5><img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Tux.png" width=10> Linux<br></h5>

> Not done yet, feel free to make a PR 🎉

<h5><img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" width=10> Windows<br></h5>

> Not done yet, feel free to make a PR 🎉

<h5><img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Apple_Computer_Logo_rainbow.svg" width=10> MacOS</h5>

The easiest way to install PostgreSQL is to use [Homebrew](https://brew.sh/) with:

```bash
brew install postgresql@13
brew services start postgresql@13 # start postgresql service
```

#### Configuration

After the installation, you can use [pgAdmin](https://www.pgadmin.org/) to create a server with the following parameters:

|    `.env`     |      pgAdmin 4       | value                                                                                     |
| :-----------: | :------------------: | :---------------------------------------------------------------------------------------- |
|   `DB_HOST`   |         Host         | `127.0.0.1`                                                                               |
|   `DB_PORT`   |         Port         | `5432`                                                                                    |
| `DB_USERNAME` |       Username       | Should be the username you used to install postgresql or any user you have created for it |
| `DB_PASSWORD` |       Password       | leave it empty, unless you have set a password for your postgresql user                   |
| `DB_DATABASE` | Maintenance database | `postgres`                                                                                |

> **Note**  
> You can also use [TablePlus](https://tableplus.com/) to manage your databases as a lightweight (but more limited, in the free edition) alternative to pgAdmin.

> **Note**  
> You have to create a server before creating a database, as the database will be created in the server you have selected.

#### First time setup

As the database has never been used, you will need to create it and run the seeders to populate it with some base data. You can do so with the following commands:

```bash
# create the database (will drop if already exists and create it again)
pnpm run db:create

# run the seeders (to populate the database with some base data)
pnpm run db:seed
```

## Launch

The API is built with [NestJS](https://nestjs.com/) and uses [TypeScript](https://www.typescriptlang.org/). You can run it with the following commands:

```bash
# debug mode
pnpm run start:debug

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Tests

Both unit and e2e tests are available and run with [Jest](https://jestjs.io/). You can run them with the following command:

```bash
# all tests
pnpm test

# unique test file
pnpm test -- "auth.e2e-spec.ts"
```

> After running the tests, a coverage report is generated in the `./coverage` folder.

## Linting

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to lint the code. You can run the linter with the following command:

```bash
pnpm run lint
```

## Documentation

Swagger is used to generate the documentation of the API, you can access it at the `/docs` endpoint when the app is launched.

For the more in depth documentation on how to develop on this project, you can check the [wiki](https://github.com/ae-utbm/api/wiki).
