# Marketplace

This is a project to showcase some of my code skills. It's still a work in progress.

The domain of the projects is of a services marketplace app, where clients 
publish jobs and contractors offer their services.

## Getting Started

First, start the DB:

```bash
yarn start:db
```

A docker PostgreSQL DB container will start and will run the migrations.

Second, run the development server:

```bash
yarn dev
```

You could also seed the DB with some dummy data:
```bash
yarn seed
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Run tests

### Unit tests
These are quick tests that don't use the DB and test individual functions.

Run the **unit** tests:

```bash
yarn test:unit
```
### API e2e tests
These tests run the API endpoints end to end. They need the DB and the development
server running.

To run them, first, make sure you are running the development server as explained before.

Second, you can run **api e2e** tests:
```bash
yarn test:api
```

You can add `--watch` to these commands to keep running tests as you make changes
to the code base. 

## Project structure

This project uses `Next.js` framework and the structure is adapted for it. 

- `[prisma]`        **ORM** Contains DB schema and migrations.
- `[public]`        **Public folder** To place public resources like images.
- `[src/components]`**React components**
- `[src/e2e/api]`   **API e2e tests** 
- `[src/models]`    **Models** Data models and domain logic.
- `[src/pages]`     **Front-end pages** React pages.
- `[src/pages/api]` **API endpoints** The `pages/api` directory is mapped to `/api/*`. 
Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) 
instead of React pages.
- `[src/styles]`    **CSS files** For global styling and shared css classes.
- `[src/types]`     **Types** For global typing and overwriting dependencies types.
- `[src/utils]`     **Utilities** For functions to be used across the project that are 
not related to domain logic.


## Development

### Migrations

If you want to create a new migration:
 1. Update `prisma/schema.prisma` with your changes.
 2. Run: 
 ```
 yarn migration:create <name_of_new_migration>
 ```
 3. If desired customize the resulting SQL file that was added to `/prisma/migrations`
 4. Apply the migration:
 ```
 yarn migrate:up
 ```
 5. Restart the dev server or run the next script to update the Prisma ORM lib:
 ```
 yarn gen:prisma
 ``` 

### Yarn

This project uses v3 of yarn, which handles dependencies differently from v1.

If you need to run an arbitrary Node script, use `yarn node` as the interpreter, 
instead of `node`. This will be enough to register the .pnp.cjs file as a runtime dependency.

```
yarn node ./script.js
```

You can update yarn with
```
yarn set version latest
```

Your IDE may complain that can't find modules. There are instructions 
[here](https://yarnpkg.com/getting-started/editor-sdks) on how to fix this.

