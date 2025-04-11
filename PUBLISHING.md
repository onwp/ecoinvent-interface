# Publishing to GitHub Packages

This document provides instructions on how to publish the package to GitHub Packages.

## Prerequisites

The GitHub Actions workflow is already set up to publish the package to GitHub Packages when a new release is created. The workflow has been configured with the necessary permissions for the GITHUB_TOKEN to allow publishing packages.

## Publishing the Package

To publish the package, simply create a new release:

1. Go to your repository on GitHub
2. Click on "Releases" in the right sidebar
3. Click "Create a new release"
4. Enter a tag version (e.g., v1.0.0)
5. Add a title and description
6. Click "Publish release"

The GitHub Actions workflow will automatically build, test, and publish your package to GitHub Packages.

## Troubleshooting

If you encounter any issues during the publishing process, check the following:

1. Make sure the package.json file does not have the `private` flag set to `true`
2. Make sure the repository URL in the package.json file is correct
3. Check the GitHub Actions logs for any error messages
4. Make sure the workflow file has the correct permissions for the GITHUB_TOKEN

## Using the Published Package

To use the published package in another project, you need to configure npm to use GitHub Packages:

1. Create or edit a `.npmrc` file in your project root:

```
@onwp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set the `GITHUB_TOKEN` environment variable with a Personal Access Token that has the `read:packages` permission

3. Install the package:

```bash
npm install @onwp/ecoinvent-interface
```
