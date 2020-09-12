
set -e

yarn docs:build
cd docs/.vuepress/dist
set NODE_ENV=prod
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:flynn-eye/blog.git master:gh-pages
cd -