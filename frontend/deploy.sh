#!/bin/bash

echo "Switching to branch main"
git checkout main

echo "Building app..."
npm run build

# Generate backup folder name with timestamp

# echo "---- TESTING ------"
# scp -r build/* junebence@172.16.0.25:/var/www/lesspapersystem/

echo "---- PRODUCTION ------"
scp -r build/* lesspapersystem@172.16.0.27:/var/www/lesspapersystem/

echo "✅ Build and deploy finished successfully!"

