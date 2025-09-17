# Install Packages
```bash
# Install tsup, the library that will help us compile...
npm i -D tsup
```

# Publish...
```bash
npm version patch && npm run bundle && npm publish --access=public
```

# Verify Publication
```bash
npm info ggpm


# Deprecate versions
npm deprecate ggpm@1.0.0 "Use >=1.0.17 instead"
npm deprecate ggpm@1.0.1 "Use >=1.0.17 instead"
npm deprecate ggpm@1.0.2 "Use >=1.0.17 instead"
```
