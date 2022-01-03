#!/bin/bash
if [ ! -e config/default.yml ]; then
  cp config/default.sample.yml config/default.yml
  echo "Please edit config/default.yml edit"
  read -p "Press any key to continue..."
fi
yarn

cd speech-recognition
python3 -mvenv venv
venv/bin/pip install -r requirements.txt

cd ../

yarn build