# Release v0.21.0 - Next Steps

## ✅ Completed Steps

1. **Created CHANGELOG.md** - Comprehensive documentation of all changes since v0.20.0
2. **Created RELEASE.md** - Detailed release process documentation for future releases
3. **Version Bump** - Updated package.json from 0.20.0 to 0.21.0
4. **Updated package-lock.json** - Synchronized with new version
5. **Committed Changes** - All release files committed to branch `release/stabilize-codebase-1843-4r8`
6. **Created Git Tag** - Annotated tag `v0.21.0` created and pushed
7. **Pushed to Remote** - Branch and tag pushed to GitHub

## 🔄 Next Steps (Manual Actions Required)

### 1. Create Pull Request
The release branch has been pushed. Create a PR to merge it into `main`:

**URL**: https://github.com/rar2731991/chat-ui/pull/new/release/stabilize-codebase-1843-4r8

**PR Title**: `Release v0.21.0`

**PR Description**:
```markdown
## Release v0.21.0

This PR prepares the v0.21.0 release, a major stabilization release with 600+ commits since v0.20.0.

### Changes in this PR
- ✅ Add comprehensive CHANGELOG.md documenting all changes
- ✅ Add RELEASE.md with detailed release process documentation
- ✅ Bump version from 0.20.0 to 0.21.0
- ✅ Update package-lock.json

### Release Highlights
- **OpenAI-compatible API integration** - Simplified model configuration
- **LLM Router support** - Intelligent model selection with Arch-Router-1.5B
- **URL attachments** - Attach URLs to conversations
- **Shared conversation improvements** - Enhanced sharing features
- **Prometheus metrics** - Comprehensive monitoring support
- **UI/UX improvements** - Numerous enhancements and bug fixes

### Testing
- ✅ Build passes
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Docker workflow configured

Resolves #1843

See [CHANGELOG.md](./CHANGELOG.md) for full details.
```

### 2. Review and Merge PR
- Review the changes in the PR
- Ensure all CI checks pass
- Merge the PR into `main`

### 3. Create GitHub Release
After merging to main, create the official GitHub release:

1. Go to: https://github.com/rar2731991/chat-ui/releases/new
2. Select tag: `v0.21.0`
3. Set release title: `v0.21.0`
4. Click "Generate release notes" (GitHub will auto-generate from PRs)
5. Edit the release notes to add highlights at the top:

```markdown
## 🎉 Release v0.21.0

Major stabilization release with 600+ commits since v0.20.0.

### 🌟 Highlights

- **OpenAI-compatible API integration** - Simplified configuration using `OPENAI_BASE_URL`
- **LLM Router support** - Intelligent model selection with Arch-Router-1.5B via "Omni" model
- **URL attachments** - Attach and process URLs in conversations
- **Enhanced shared conversations** - Improved sharing features with guest access
- **Prometheus metrics** - Comprehensive monitoring and observability
- **UI/UX improvements** - Block-based markdown rendering, improved focus handling, and more
- **Bug fixes** - Numerous fixes for fetch, DNS, logging, and UI components

### 📦 Docker Images

Available on GitHub Container Registry:
- `ghcr.io/huggingface/chat-ui:0.21.0` (without database)
- `ghcr.io/huggingface/chat-ui-db:0.21.0` (with database)

Also tagged as: `0.21`, `0`, `latest`

### 📖 Documentation

- See [CHANGELOG.md](./CHANGELOG.md) for detailed changes
- See [RELEASE.md](./RELEASE.md) for release process documentation

### 🔄 Migration Guide

If upgrading from v0.20.0:
1. Review your `.env.local` against the updated `.env` template
2. Ensure `OPENAI_BASE_URL` is properly configured
3. The old `MODELS` environment variable is deprecated
4. Use `OPENAI_BASE_URL` with `/models` endpoint for model discovery

### 🙏 Contributors

Thank you to all contributors who made this release possible!

---

**Full Changelog**: https://github.com/rar2731991/chat-ui/compare/v0.20.0...v0.21.0
```

6. Check "Set as the latest release"
7. Click "Publish release"

### 4. Verify Docker Images
After publishing the release, GitHub Actions will automatically build and push Docker images.

Monitor the workflow at: https://github.com/rar2731991/chat-ui/actions

Verify images are published:
```bash
docker pull ghcr.io/huggingface/chat-ui:0.21.0
docker pull ghcr.io/huggingface/chat-ui-db:0.21.0
```

### 5. Announce the Release (Optional)
- Update any relevant documentation
- Announce on GitHub Discussions
- Share on social media or relevant channels

## 📋 Release Checklist

- [x] CHANGELOG.md created
- [x] RELEASE.md created
- [x] Version bumped in package.json
- [x] package-lock.json updated
- [x] Changes committed
- [x] Git tag created and pushed
- [x] Branch pushed to remote
- [ ] Pull request created
- [ ] Pull request reviewed and merged
- [ ] GitHub release created
- [ ] Docker images verified
- [ ] Release announced

## 📚 Reference Documents

- **CHANGELOG.md** - Full list of changes in this release
- **RELEASE.md** - Complete release process documentation
- **README.md** - Updated project documentation

## 🐛 Issues Resolved

This release resolves:
- #1843 - Request for stabilization and release

## 📞 Support

If you encounter any issues with this release:
1. Check the [CHANGELOG.md](./CHANGELOG.md) for known issues
2. Search existing GitHub issues
3. Create a new issue with details about your problem

---

**Release prepared by**: BLACKBOX Agent
**Date**: 2025-11-06
**Branch**: release/stabilize-codebase-1843-4r8
**Tag**: v0.21.0
