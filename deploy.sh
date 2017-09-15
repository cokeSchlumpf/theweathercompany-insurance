#!/bin/bash

# Configuration
PACKAGE=twc-bot
PACKAGE_GENERIC=${PACKAGE}-generic
PACKAGE_API=${PACKAGE}-api

# Create package if not existing
echo "Creating Package '${PACKAGE_GENERIC}'"
wsk package create ${PACKAGE_GENERIC} &> /dev/null || true
wsk package create ${PACKAGE_API}  &> /dev/null || true

for dir in `find . -maxdepth 1 -mindepth 1 -type d | grep -v .git`
do
    ACTION=`echo $dir | awk -F'/' '{ print $2 }'`;

    pushd ${dir} > /dev/null
      echo "Creating package for action '${ACTION}' ..."
      NAME="${PACKAGE_GENERIC}/${ACTION}"
      DESCRIPTION=`cat package.json | grep description | awk -F'"' '{ print $4 }'`
      zip -r action.zip * > /dev/null

      echo "Creating action '${NAME}' ..."
      wsk action list | grep ${NAME} > /dev/null && wsk action delete ${NAME} &> /dev/null || true
      wsk action update ${NAME} \
        --kind nodejs:6 action.zip \
        -a description "${DESCRIPTION}"

      rm action.zip
    popd > /dev/null
done

# Create package bindings
echo "Binding parameters to package '${PACKAGE}' ..."
wsk package delete twc-bot || true
pwd
wsk package bind serverless-botpack-generic ${PACKAGE} -P package.paramaters.json

# Create a web action
wsk action create ${PACKAGE_API}/core-input \
        --sequence ${PACKAGE}/core-input \
        --web true