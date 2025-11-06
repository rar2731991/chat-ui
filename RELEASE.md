# Release Process

This document describes the release process for Chat UI.

## Table of Contents

- [Overview](#overview)
- [Release Checklist](#release-checklist)
- [Versioning](#versioning)
- [Creating a Release](#creating-a-release)
- [Post-Release](#post-release)
- [Troubleshooting](#troubleshooting)

## Overview

Chat UI follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New features, backward compatible
- **PATCH** version (0.0.X): Bug fixes, backward compatible

Releases are published to:
- GitHub Releases (with auto-generated release notes)
- Docker images on GitHub Container Registry (ghcr.io)
  - `ghcr.io/huggingface/chat-ui:VERSION` (without database)
  - `ghcr.io/huggingface/chat-ui-db:VERSION` (with database)

## Release Checklist

Before creating a release, ensure:

- [ ] All intended features and fixes are merged to `main`
- [ ] Build passes: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run check`
- [ ] Tests pass: `npm test` (requires Playwright: `npx playwright install`)
- [ ] CHANGELOG.md is updated with release notes
- [ ] package.json version is bumped
- [ ] package-lock.json is updated (`npm install --package-lock-only`)
- [ ] Docker builds successfully (see [Docker Build Test](#docker-build-test))
- [ ] All changes are committed

## Versioning

### Determining the Version Number

1. **Patch Release (0.X.Y)**: Bug fixes only, no new features
   - Example: 0.21.0 → 0.21.1

2. **Minor Release (0.X.0)**: New features, backward compatible
   - Example: 0.21.0 → 0.22.0

3. **Major Release (X.0.0)**: Breaking changes
   - Example: 0.21.0 → 1.0.0

### Updating Version

1. Update `package.json`:
   ```bash
   # Edit package.json manually or use npm version
   npm version minor --no-git-tag-version  # for minor release
   npm version patch --no-git-tag-version  # for patch release
   npm version major --no-git-tag-version  # for major release
   ```

2. Update `package-lock.json`:
   ```bash
   npm install --package-lock-only
   ```

3. Update `CHANGELOG.md`:
   - Add a new section for the version
   - Document all changes under appropriate categories:
     - Added (new features)
     - Changed (changes in existing functionality)
     - Deprecated (soon-to-be removed features)
     - Removed (removed features)
     - Fixed (bug fixes)
     - Security (security fixes)

## Creating a Release

### Step 1: Prepare the Release Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create a release branch (optional but recommended)
git checkout -b release/v0.21.0
```

### Step 2: Update Version and Changelog

```bash
# Update package.json version
npm version minor --no-git-tag-version

# Update package-lock.json
npm install --package-lock-only

# Edit CHANGELOG.md with release notes
# Document all changes since last release
```

### Step 3: Verify the Build

```bash
# Run all checks
npm run lint
npm run check
npm run build

# Run tests (requires Playwright)
npx playwright install
npm test
```

### Step 4: Docker Build Test

Test that Docker images build successfully:

```bash
# Build without database
docker build -t chat-ui:test --build-arg INCLUDE_DB=false .

# Build with database
docker build -t chat-ui-db:test --build-arg INCLUDE_DB=true .

# Optional: Test the image
docker run -p 3000:3000 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  -e OPENAI_BASE_URL=https://router.huggingface.co/v1 \
  -e OPENAI_API_KEY=your_key_here \
  chat-ui:test
```

### Step 5: Commit and Push

```bash
# Commit the version bump and changelog
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.21.0"

# Push to remote
git push origin release/v0.21.0

# Create a pull request to main (if using release branch)
# Or push directly to main if you have permissions
```

### Step 6: Create Git Tag

After the release commit is merged to main:

```bash
# Ensure you're on main
git checkout main
git pull origin main

# Create an annotated tag
git tag -a v0.21.0 -m "Release v0.21.0"

# Push the tag
git push origin v0.21.0
```

### Step 7: Create GitHub Release

1. Go to https://github.com/huggingface/chat-ui/releases/new
2. Select the tag you just created (v0.21.0)
3. Set the release title: `v0.21.0`
4. Click "Generate release notes" to auto-generate from PRs
5. Edit the release notes:
   - Add highlights at the top
   - Reference the CHANGELOG.md for detailed changes
   - Include migration notes if needed
6. Check "Set as the latest release"
7. Click "Publish release"

### Step 8: Verify Docker Images

After publishing the release, GitHub Actions will automatically build and push Docker images.

Monitor the workflow at: https://github.com/huggingface/chat-ui/actions

Verify images are published:
```bash
# Check without database
docker pull ghcr.io/huggingface/chat-ui:0.21.0
docker pull ghcr.io/huggingface/chat-ui:0.21
docker pull ghcr.io/huggingface/chat-ui:0
docker pull ghcr.io/huggingface/chat-ui:latest

# Check with database
docker pull ghcr.io/huggingface/chat-ui-db:0.21.0
docker pull ghcr.io/huggingface/chat-ui-db:0.21
docker pull ghcr.io/huggingface/chat-ui-db:0
docker pull ghcr.io/huggingface/chat-ui-db:latest
```

## Post-Release

### Announce the Release

1. Update documentation if needed
2. Announce on relevant channels:
   - GitHub Discussions
   - Discord/Slack (if applicable)
   - Social media (if applicable)

### Monitor for Issues

- Watch for bug reports related to the new release
- Be prepared to create a patch release if critical issues are found

### Plan Next Release

- Create a milestone for the next version
- Start planning features for the next release

## Troubleshooting

### Build Fails

If the build fails:
1. Check the error messages
2. Ensure all dependencies are installed: `npm install`
3. Clear build cache: `rm -rf .svelte-kit node_modules/.vite`
4. Try building again: `npm run build`

### Docker Build Fails

If Docker build fails:
1. Check Dockerfile syntax
2. Ensure all required files are present
3. Check .dockerignore isn't excluding necessary files
4. Try building with `--no-cache`: `docker build --no-cache -t test .`

### Tag Already Exists

If you need to move a tag:
```bash
# Delete local tag
git tag -d v0.21.0

# Delete remote tag
git push origin :refs/tags/v0.21.0

# Create new tag
git tag -a v0.21.0 -m "Release v0.21.0"

# Push new tag
git push origin v0.21.0
```

### GitHub Actions Workflow Fails

1. Check the workflow logs in GitHub Actions
2. Verify secrets are properly configured (GITHUB_TOKEN should be automatic)
3. Ensure the workflow file is valid YAML
4. Check that the tag matches the expected format (v*.*.*)

### Release Notes Not Generated

If GitHub doesn't auto-generate release notes:
1. Ensure PRs have proper labels (enhancement, bug, etc.)
2. Check `.github/release.yml` configuration
3. Manually copy relevant sections from CHANGELOG.md

## Release Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Prepare Release                                          │
│    - Update version in package.json                         │
│    - Update CHANGELOG.md                                    │
│    - Run tests and build                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Commit Changes                                           │
│    - Commit version bump and changelog                      │
│    - Push to main (or create PR)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create Git Tag                                           │
│    - Create annotated tag (v0.21.0)                         │
│    - Push tag to remote                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create GitHub Release                                    │
│    - Create release from tag                                │
│    - Generate/edit release notes                            │
│    - Publish release                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Automated Docker Build                                   │
│    - GitHub Actions triggers on release                     │
│    - Builds and pushes Docker images                        │
│    - Tags: VERSION, MAJOR, MINOR, latest                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Verify & Announce                                        │
│    - Verify Docker images are available                     │
│    - Announce release                                       │
│    - Monitor for issues                                     │
└─────────────────────────────────────────────────────────────┘
```

## Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Docker Build Documentation](https://docs.docker.com/engine/reference/commandline/build/)

## Questions?

If you have questions about the release process, please:
1. Check this documentation
2. Review previous releases for examples
3. Ask in GitHub Discussions
4. Contact the maintainers
