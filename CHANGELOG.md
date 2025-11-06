# Changelog

All notable changes to Chat UI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.21.0] - 2025-11-06

This is a major stabilization release with significant improvements to the OpenAI-compatible API integration, UI/UX enhancements, and numerous bug fixes. This release represents substantial progress since the last official release.

### Added

#### Features
- **LLM Router Support**: Added client-side routing with Arch-Router-1.5B model for intelligent model selection via "Omni" virtual model alias
- **URL Attachments**: Support for attaching URLs to conversations (#1965, #1950)
- **Prometheus Metrics**: Added comprehensive metrics support with prom-client for monitoring (#1934)
- **Admin Export Feature**: Added admin-only export functionality with rate limiting (once per hour) and streaming zip support (#1862)
- **OAuth on Welcome Modal**: Improved authentication flow with OAuth integration on welcome screen (#1939)
- **Shared Conversation Features**: 
  - Redirect to shared conversation after login (#1962)
  - Preserve and sanitize return path after login (#1959)
  - Allow guest access on home and shared conversations (#1960)
  - Fix follow-up messages on shared conversations (#1963)
- **Plus UI Dropdown**: Enhanced UI for Plus tier features (#1971)
- **Admin Model Refresh**: Added button to manually refresh models in application settings (#1961)
- **Provider Information**: Added provider info to router metadata in chat messages
- **Custom Headers Support**: Added support for custom headers in endpoint inference client
- **Message Trimming**: Implemented message trimming for router prompt construction (#1935)
- **Poe Provider Support**: Added Poe as an inference provider (#1943)
- **Delete Message Functionality**: Implemented message deletion using API client
- **Tool Search**: Moved tool search to API client

#### UI/UX Improvements
- **Markdown Rendering**: Refactored to use block-based processing for better streaming support
- **Incomplete Markdown Parser**: Added parser for improved streaming markdown display
- **Code Block Formatting**: Fixed code block detection and formatting in markdown parser
- **Theme Toggle**: Improved theme toggle button layout and responsiveness
- **Scrollbar Styling**: Added custom background for scrollbars in Safari dark mode
- **Focus Handling**: Improved focus handling for ChatInput textarea
- **Modal Improvements**: 
  - Adjusted modal height for settings layout
  - Added ESC key handler to close HTML preview modal
- **Image Preview**: Adjusted image preview height in UploadedFile component
- **Responsive Layout**: Improved layout responsiveness in ChatMessage component
- **Heading Sizes**: Reduced heading sizes for .prose-sm class
- **Router Details**: Reduced router details display delay to 500ms
- **Textarea Height**: Refactored ChatInput textarea height adjustment logic
- **Navigation**: Fixed nav conversation item layout

#### Configuration & Settings
- **Settings Store**: Added initValue to settings store and refactored model settings initialization
- **Message Length Limits**: Increased max assistant and user message lengths
- **Image Upload**: Reduced max image upload size to 1MB and max dimensions in OAI parameters schema
- **Custom User-Agent**: Set custom User-Agent for HuggingChat requests
- **Environment Variables**: Updated environment variables and production config
- **Plausible Analytics**: Initialized Plausible script support (#1946)
- **Dev Favicons**: Added dev favicons with conditional favicon logic

### Fixed

#### Bug Fixes
- **Fetch & Network**:
  - Fixed DNS resolution issues (multiple commits)
  - Fixed fetch debugging and URL logs
  - Allow fetch redirects
  - Fixed communication with HuggingFace (#1966)
- **Logging**: Fixed structured logs implementation (#1967)
- **Metrics**: Fixed Prometheus scrape config and k8s metrics port declaration
- **Authentication**: Fixed HuggingChat OAuth flow
- **Code Blocks**: 
  - Fixed formatting inside incomplete code blocks
  - Fixed key for last streaming Markdown block
- **UI Components**:
  - Fixed URL reactivity in UploadedFile component
  - Fixed ESLint errors
  - Removed alt text from model logo image (#1936)
  - Replaced logout button with non-interactive div
  - Fixed textarea focus handling
- **Settings**: Fixed settings page issues
- **Conversations**: 
  - Fixed rename chat bug
  - Fixed starting chat-ui with no .env.local
  - Fixed share feature
- **Error Handling**: 
  - Improved error handling in generateFromDefaultEndpoint (#1853)
  - Added catch for missing assistant errors
  - Added optional chaining for choices array access
  - Added tick() to prevent textarea height adjustment failures (#1854)
- **Tools**: Fixed tools functionality
- **Export**: 
  - Fixed export to skip unavailable files
  - Fixed to not export whole websearch data
- **Tests**: Fixed test suite issues
- **Swagger**: Fixed swagger configuration
- **Navigation**: Fixed spacing in NavMenu and ChatMessage components

### Changed

#### Refactoring
- **API Client Migration**: Major refactoring to use new API client architecture
  - Moved delete conversation & title edit to new API
  - Refactored to use client API for spaces-config endpoint
  - Refactored to use API client for delete follow of assistant
  - API cleanup (#1849)
- **Model References**: Updated GLM model references to GLM-4.6
- **Router Configuration**: Updated primary model for editing_rewrite route to moonshotai/Kimi-K2-Instruct-0905
- **DOMPurify**: Replaced isomorphic-dompurify with custom DOMPurify wrapper
- **Build Process**: Removed SKIP_LLAMA_CPP_BUILD argument and related logic from workflows
- **Markdown Processing**: Refactored markdown rendering to block-based system for better streaming
- **Model Caching**: Implemented model caching to avoid redundant dynamic imports
- **SvelteKit Integration**: Replaced history.replaceState with SvelteKit replaceState

#### Documentation
- **README**: Updated HuggingChat links and models header
- **Links**: 
  - Updated Hugging Face discussions link
  - Updated Hugging Face providers settings link
  - Fixed llama-server README link (#1869)
  - Added target=blank to external links in App Settings (#1937)
- **Removed**: Removed PROMPTS.md documentation file (outdated)
- **App Description**: Updated app description in environment configs

#### Configuration
- **DeepSeek R1**: Allow `<think>` tags in content for DeepSeek R1 models
- **Strip Think Blocks**: Strip `<think>` blocks from copied chat message content
- **Router Multimodal**: Added support for configuring router multimodal model via environment variable
- **Policy Errors**: Include 400 in policy error status codes
- **Deployment**: Updated deployment configuration (#1933)
- **App Icons**: Updated app icons with new designs for various resolutions
- **Kubernetes**: Reduced min pods following closure (#1865)

### Reverted
- Multiple experimental features were tested and reverted during development cycle
- Multimodal override for HuggingChat models (tested and reverted)
- Various URL attachment implementations (iterated multiple times)
- Share conversations feature (reverted and re-implemented)
- Router metadata display logic (refined through iterations)

### Security
- **Content Sanitization**: Improved content sanitization in shared conversations
- **Return Path Validation**: Added return path sanitization after login

### Performance
- **Model Loading**: Cached models to avoid redundant dynamic imports
- **Streaming**: Improved streaming performance with block-based markdown rendering
- **Export**: Removed await blocks in export, start streaming zip immediately
- **Timeout Handling**: Enhanced timeout handling in BackgroundGenerationPoller
- **Abort Handling**: Reduced timeout duration for aborting loading state

### Developer Experience
- **Logging**: Enhanced logging throughout the application
- **Error Messages**: Improved error messages and debugging information
- **Code Quality**: Fixed ESLint errors and improved code formatting
- **Type Safety**: Improved TypeScript type safety across components

---

## [0.20.0] - Previous Release

Previous releases were not formally documented. This CHANGELOG starts with version 0.21.0.

---

## Release Notes

### Migration Guide for 0.21.0

This release includes significant changes to the API architecture. If you're upgrading from a previous version:

1. **Environment Variables**: Review your `.env.local` file against the updated `.env` template
2. **OpenAI Compatibility**: Ensure your `OPENAI_BASE_URL` is properly configured
3. **Model Configuration**: The old `MODELS` environment variable is deprecated; use `OPENAI_BASE_URL` with `/models` endpoint
4. **Docker Images**: New Docker images are available at `ghcr.io/huggingface/chat-ui:0.21.0` and `ghcr.io/huggingface/chat-ui-db:0.21.0`

### Known Issues

- Browser tests require Playwright installation (`npx playwright install`)
- Some circular dependencies in build output (non-breaking)

### Contributors

Thank you to all contributors who made this release possible! This release includes 600+ commits from the community.

---

For more information, visit the [GitHub repository](https://github.com/huggingface/chat-ui).
