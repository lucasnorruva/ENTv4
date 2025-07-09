#!/bin/bash

# Unset the NPM_CONFIG_PREFIX environment variable
unset NPM_CONFIG_PREFIX

# Execute the command passed to the script
# Source nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
"$@"