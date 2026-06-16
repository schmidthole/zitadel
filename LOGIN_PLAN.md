# Login App Plan File

This file describes the plans regarding the modifications to the zitadel login v2 next.js application (located in `./apps/login`). This repo is a fork of the mainline zitadel codebase so that some choice modification can be made to the login flow without reproducing the entire pipeline.

## Principles

The following principles should be upheld when making changes to the login app:

- All changes should be made so that the login app changes can be upstreamed to the main zitadel repo someday
- Anything added/disabled should be done with a environment variable or associated configuration flag, allowing the default behavior to be exposed as the main zitadel repo has created it.

## Updates

To better support our use case, we need to make the following updates to the login ui

### No JIT Provisioning or User Registration

Our zitadel API instance forbids JIT provisioning and disallows all self service user registration or account creation. The zitadel login app currently exposes a "register user" button on the login screen without any way of disabling it. This is bad UX if your backend rejects this anyways. We need a way to configure this button to be disabled by default.

#### Tasks

- Add configuration flag/env var to disable registration
- Disable the register button in the login ui when the configuration flag is set

### Custom login UI title

Currently, the zitadel login app always displays the title "Welcome Back!" when the user is presented with login. This is extremely jarring for use cases where the login page has been presented from a native mobile app and the mobile app itself has welcomed the user. We need to add a customized title prompt to allow the login app to be configured with different title text.

#### Tasks

- Add configuration string/env var to set a custom title text for the login UI
- If the custom title text is populated, override the default and display the custom string
