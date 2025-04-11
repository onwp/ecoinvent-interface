# Publishing to GitHub Packages as a Private Package

This document provides instructions on how to publish the package to GitHub Packages as a private package and how to use it in other projects.

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

The GitHub Actions workflow will automatically build, test, and publish your package to GitHub Packages as a private package.

## Package Visibility and Access Control

This package is published as a private package, which means:

- Only users with access to the repository can see and install the package
- The package will not be visible to the public
- You need to authenticate with GitHub to install the package

## Using the Published Package

To use the published package in another project, you need to configure npm to use GitHub Packages:

1. Create or edit a `.npmrc` file in your project root:

```
@onwp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Set the `GITHUB_TOKEN` environment variable with a Personal Access Token that has the `read:packages` permission:

```bash
export GITHUB_TOKEN=your_personal_access_token
```

3. Install the package:

```bash
npm install @onwp/ecoinvent-interface
```

## Creating a Personal Access Token

To create a Personal Access Token for installing the package:

1. Go to your GitHub account settings
2. Click on "Developer settings" in the left sidebar
3. Click on "Personal access tokens" and then "Tokens (classic)"
4. Click "Generate new token" and then "Generate new token (classic)"
5. Give your token a descriptive name (e.g., "npm-packages")
6. Select the `read:packages` scope
7. Click "Generate token"
8. Copy the token and store it securely

## Troubleshooting

If you encounter any issues during the publishing process, check the following:

1. Make sure the repository URL in the package.json file is correct
2. Check the GitHub Actions logs for any error messages
3. Make sure the workflow file has the correct permissions for the GITHUB_TOKEN
4. Ensure you have the necessary permissions to publish packages to the repository
