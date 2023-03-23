# Marketplace

## Development

This project uses v2 of yarn, which handles dependencies differently.

If you need to run an arbitrary Node script, use `yarn node` as the interpreter, 
instead of `node`. This will be enough to register the .pnp.cjs file as a runtime dependency.

```
yarn node ./script.js
```