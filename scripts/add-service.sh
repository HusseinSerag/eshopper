#!/bin/bash

SERVICE_NAME=$1
E2E_RUNNER=${2:-none}  # Default to 'none' if not provided

npx nx g @nx/node:app $SERVICE_NAME \
  --directory=apps/$SERVICE_NAME \
  --framework=express \
  --bundler=esbuild \
  --docker=true \
  --linter=eslint \
  --e2eTestRunner=$E2E_RUNNER

