# ZITADEL Login UI Fork

This fork publishes a customized ZITADEL Login UI container image for SwiftConnect-oriented deployments while keeping the main ZITADEL server image separate from upstream.

The goal is to consume upstream ZITADEL normally, but replace the Login UI v2 container with the image produced by this fork.

## Published Image

The fork publishes the Login UI image to GitHub Container Registry:

```text
ghcr.io/schmidthole/zitadel-login:login-app-fork
```

The `login-app-fork` tag is updated by the fork workflow on pushes to the `login-app-fork` branch and can also be rebuilt manually through GitHub Actions.

For production-like deployments, prefer pinning a digest after validating an image:

```text
ghcr.io/schmidthole/zitadel-login@sha256:<digest>
```

The image pulled successfully on June 26, 2026 with this digest:

```text
sha256:00d1f8e61fd3e8bab45745b3d09dc391de48ce7cbbb6af916fddff22cc781e92
```

## What This Fork Changes

This branch currently contains the following fork-specific updates:

- Adds a GitHub Actions workflow at `.github/workflows/login-app-fork-image.yml` to build and publish the Login UI image to `ghcr.io/schmidthole/zitadel-login`.
- Adds root-level local development helpers in `Makefile` and `docker-compose.yml` for running ZITADEL plus the forked Login UI locally.
- Updates the Login UI login-name page metadata to use `ZITADEL_LOGIN_TITLE` when provided.
- Renames user-facing "Loginname" copy to "Username" in the Login UI demo metadata and default query translation data.
- Adds Login UI build cache inputs for theme and application-name environment variables so Nx rebuilds when those values change.
- Removes Nx Cloud wiring from this fork's CI workflows and `nx.json`.

## Build-Time Login UI Defaults

The published workflow builds the Login UI with these public build-time values:

```env
NEXT_PUBLIC_BASE_PATH=/ui/v2/login
NEXT_PUBLIC_APPLICATION_NAME=SwiftConnect
NEXT_PUBLIC_THEME_ROUNDNESS=mid
NEXT_PUBLIC_THEME_LAYOUT=top-to-bottom
NEXT_PUBLIC_THEME_APPEARANCE=glass
NEXT_PUBLIC_THEME_SPACING=compact
```

These `NEXT_PUBLIC_*` values are compiled into the Next.js Login UI image. Changing them requires rebuilding and republishing the image.

Runtime server-side Login UI settings, such as `ZITADEL_LOGIN_TITLE`, can be supplied as container environment variables.

## Consuming The Forked Login UI

Use the normal ZITADEL server image, then point Login v2 URLs at the forked Login UI container.

Example Compose service:

```yaml
services:
  zitadel-login:
    image: ghcr.io/schmidthole/zitadel-login:login-app-fork
    environment:
      ZITADEL_API_URL: http://zitadel:8080
      ZITADEL_API_AWAITINITIALCONN: 120s
      ZITADEL_SESSION_COOKIE_SECRET: "${ZITADEL_SESSION_COOKIE_SECRET:?Set a shared random secret of at least 32 characters}"
      ZITADEL_SERVICE_USER_TOKEN_FILE: /zitadel/bootstrap/login-client.pat
      CUSTOM_REQUEST_HEADERS: Host:localhost:9000,X-Forwarded-Proto:http
      ZITADEL_LOGIN_DISABLE_REGISTRATION: "true"
      ZITADEL_LOGIN_TITLE: Login to SwiftConnect
    ports:
      - "9001:3000"
```

The corresponding ZITADEL server configuration must enable Login v2 and point default login/logout URLs to the Login UI:

```env
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_REQUIRED=true
ZITADEL_DEFAULTINSTANCE_FEATURES_LOGINV2_BASEURI=http://localhost:9001/ui/v2/login/
ZITADEL_OIDC_DEFAULTLOGINURLV2=http://localhost:9001/ui/v2/login/login?authRequest=
ZITADEL_OIDC_DEFAULTLOGOUTURLV2=http://localhost:9001/ui/v2/login/logout?post_logout_redirect=
ZITADEL_SAML_DEFAULTLOGINURLV2=http://localhost:9001/ui/v2/login/login?samlRequest=
```

Adjust hostnames, ports, and schemes for the target environment. Public deployments should use HTTPS URLs and externally reachable hostnames.

## Local Development

This fork includes a root `Makefile` and Compose stack for local testing.

Set a session-signing secret, then start the local stack. Keep the same secret across restarts (and all replicas); store it in your deployment secret manager for persistent environments.

```bash
export ZITADEL_SESSION_COOKIE_SECRET="$(openssl rand -base64 32)"
make dev-up
```

This builds local API and Login UI images, starts Postgres, starts ZITADEL on `http://localhost:9000`, and starts the Login UI on `http://localhost:9001/ui/v2/login`.

Useful targets:

```bash
make dev-ps
make dev-logs
make dev-down
make dev-clean
make login-test
```

The root `Makefile` sets the same SwiftConnect-oriented Login UI defaults used by the fork workflow unless they are overridden on the command line.

## Rebuilding And Publishing

The fork workflow is defined in:

```text
.github/workflows/login-app-fork-image.yml
```

It runs on:

- Pushes to `login-app-fork`
- Manual `workflow_dispatch`

The workflow:

1. Installs pnpm dependencies.
2. Builds `@zitadel/login`.
3. Builds a multi-architecture Docker image for `linux/amd64` and `linux/arm64`.
4. Publishes tags:
   - `login-app-fork`
   - the long commit SHA

To verify the published image from a consumer machine:

```bash
docker pull ghcr.io/schmidthole/zitadel-login:login-app-fork
docker image inspect ghcr.io/schmidthole/zitadel-login:login-app-fork
```

## Upgrade And Rebase Notes

This fork is based on stable ZITADEL **v4.20.0** (`8afa5dd37`). Only the fork-specific commits were replayed from the previous upstream `main` base; this is not a migration of a server database created by an unreleased main-branch build.

Compatibility decisions for this update:

- `ZITADEL_LOGIN_DISABLE_REGISTRATION=true` blocks local registration and both automatic and manual IdP account creation. Existing users may still authenticate through external IdPs and link existing accounts, subject to upstream linking and verification policies.
- Mobile callbacks use upstream's redirect handling and URL sanitization. Regression coverage includes the SwiftConnect callback scheme and the `/ui/v2/login` base path.
- Set `ZITADEL_SESSION_COOKIE_SECRET` to a random value of at least 32 characters, shared by all Login UI replicas. The local Compose stack forwards this variable; if omitted, v4.20.0 still falls back to the API credential with a deprecation warning. A configured secret shorter than 32 characters makes readiness fail.
- Existing unsigned Login UI cookies are discarded on upgrade, requiring sign-in again. Application sessions and tokens are unaffected. In-progress verification, linking, and device-code flows may need to restart.
- The Login UI now checks API credentials at startup and exits if they are missing, invalid, or rejected.
- Device authorization now requires consent and applicable project grants. The login client needs `session.read` for device request lookup.
- API list endpoints enforce default and maximum limits; consumers must paginate and respect configured limits.
- Building the backend uses Go 1.26.10. Review outbound TLS certificate compatibility and stricter URL parsing if also updating the server.

See the [v4.19.2](https://github.com/zitadel/zitadel/releases/tag/v4.19.2), [v4.19.5](https://github.com/zitadel/zitadel/releases/tag/v4.19.5), and [v4.20.0](https://github.com/zitadel/zitadel/releases/tag/v4.20.0) upgrade notes. Validate the server version and database migration path separately before deploying the new Login UI against an existing instance.

Keep fork-specific documentation and operational files isolated where possible. Avoid broad edits to upstream-owned docs such as `README.md` unless there is a strong reason, because those files are more likely to conflict during upstream merges.

When rebasing or merging upstream:

- Re-check Login UI route behavior around `apps/login/src/app/(login)/loginname/page.tsx`.
- Re-check theme environment handling in `apps/login/project.json`.
- Re-run or manually dispatch the Login image workflow after resolving conflicts.
- Pull and validate the GHCR image before updating any pinned digest in consuming deployments.

