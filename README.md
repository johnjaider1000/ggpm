# GGPM - Global Guardian Package Manager

**GGPM** is a security-focused wrapper for JavaScript package managers (npm, yarn, pnpm, bun) that validates package age before installation. It prevents the installation of packages that are too recent, helping protect your projects from potentially unstable or malicious packages.

## Installation

Install GGPM globally to use it as a wrapper for your package managers:

```bash
npm install -g ggpm
```

## Features

- **Package Age Validation**: Validates that packages meet minimum release age requirements before installation
- **Multi-Package Manager Support**: Works with npm, yarn, pnpm, and bun
- **Automatic Detection**: Intelligently detects which package manager to use based on lock files or available binaries
- **Configurable Thresholds**: Set custom minimum release age via `.npmrc` configuration
- **SOLID Architecture**: Built with clean, maintainable, and extensible TypeScript code
- **CLI Compatibility**: Drop-in replacement for existing package manager commands

## Usage

After global installation, use GGPM commands instead of direct package manager commands:

### Basic Commands
```bash
# General command (auto-detects package manager)
ggpm install lodash

# Specific package manager wrappers
g/npm install express
g/yarn add react
g/pnpm install vue
g/bun add svelte
```

### Configuration

GGPM uses the standard `.npmrc` file for configuration. Create or update your `.npmrc` file in your project root to set the minimum package age (in days):

```ini
# Minimum release age in days
minimum-release-age=7
```

**Configuration Options:**
- `minimum-release-age`: Number of days a package must be published before allowing installation
- Default value: **7 days** (if no `.npmrc` file is found)

**Why 7 days by default?**
- 🐛 **Bug Detection**: Critical bugs typically surface within 2-5 days
- 🦠 **Security Issues**: Malware and typosquatting attacks are usually reported within 1-3 days
- 🔍 **Community Review**: One week allows basic community vetting and feedback
- ⚡ **Development Flow**: Short enough to not disrupt normal development workflows
- 📊 **Industry Research**: Based on analysis of npm security incidents and disclosure timelines

**Example configurations:**
```ini
# Relaxed (development/testing)
minimum-release-age=7

# Moderate (good balance)
minimum-release-age=30

# Conservative (recommended for production)
minimum-release-age=90

# Ultra-strict (enterprise/critical systems)
minimum-release-age=365
```

**Note:** The `.npmrc` file should be placed in your project root directory (same level as `package.json`).

### Example Workflow
```bash
# This will validate that lodash is at least 7 days old before installing
ggpm install lodash

# If the package is too recent, installation will be blocked
# ❌ lodash@4.17.21 is too recent (3 days). Minimum required: 7 days
# ❌ Installation blocked by packages that are too recent

# If the package meets age requirements, installation proceeds normally
# ✅ lodash meets the minimum age requirement
# ✅ All packages are valid, proceeding with installation...
```

## Package Manager Detection Priority

1. **Lock File Detection**: Checks for `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb`
2. **Binary Availability**: Falls back to checking installed package managers
3. **Default Fallback**: Uses npm if no other manager is detected

For `ggpm` command specifically, it defaults to `pnpm` if available, otherwise `npm`.

## Architecture

GGPM is built using SOLID principles with a modular architecture:

- **PackageValidator**: Validates package ages against configuration
- **PackageInfoFetcher**: Retrieves package metadata from npm registry
- **ConfigurationReader**: Reads settings from `.npmrc`
- **PackageManagerDetector**: Detects available package managers
- **CommandMapper**: Maps CLI commands to appropriate package managers

## Security Benefits

- **Prevents Zero-Day Attacks**: Blocks installation of very recent packages that might contain malicious code
- **Reduces Supply Chain Risk**: Ensures packages have been available for community review
- **Configurable Security Posture**: Adjust minimum age based on your security requirements
- **Transparent Operation**: Clear feedback on why packages are blocked or allowed

## Contributing

GGPM is built with TypeScript and follows SOLID principles. The codebase is modular and extensible, making it easy to add new features or package manager support.

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions about GGPM, please reach out:

- **Email**: [jhonjaider100015@gmail.com](mailto:jhonjaider100015@gmail.com)
- **GitHub Issues**: Submit bug reports and feature requests

---

Made with ❤️ in Colombia 🇨🇴
