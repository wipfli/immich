#!/usr/bin/env bash

function mobile {
  rm -rf ../mobile/openapi
  cd ./openapi-generator/templates/mobile/serialization/native
  wget -O native_class.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/dart2/serialization/native/native_class.mustache
  patch -u native_class.mustache <native_class.mustache.patch
  cd ../../../../..
  npx --yes @openapitools/openapi-generator-cli generate -g dart -i ./immich-openapi-specs.json -o ../mobile/openapi -t ./openapi-generator/templates/mobile

  # Post generate patches
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api_client.dart <./openapi-generator/patch/api_client.dart.patch
  patch --no-backup-if-mismatch -u ../mobile/openapi/lib/api.dart <./openapi-generator/patch/api.dart.patch
  sed -i 's/0.17.0/0.18.0/g' ../mobile/openapi/pubspec.yaml
}

function typescript {
  rm -rf ../web/src/api/open-api
  rm -rf ../sdk/typescript/*.ts

  cd ./openapi-generator/templates/typescript
  wget -O apiInner.mustache https://raw.githubusercontent.com/OpenAPITools/openapi-generator/v6.0.1/modules/openapi-generator/src/main/resources/typescript-axios/apiInner.mustache
  patch -u apiInner.mustache < apiInner.mustache.patch
  cd ../../..
  npx --yes @openapitools/openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ../web/src/api/open-api -t ./openapi-generator/templates/typescript --additional-properties=useSingleRequestParameter=true

  npx --yes @openapitools/openapi-generator-cli generate -g typescript-axios -i ./immich-openapi-specs.json -o ../sdk/typescript -t ./openapi-generator/templates/typescript --additional-properties=useSingleRequestParameter=true
}

if [[ $1 == 'mobile' ]]; then
  mobile
elif [[ $1 == 'typescript' ]]; then
  typescript
else
  mobile
  typescript
fi
