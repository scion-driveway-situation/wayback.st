export PATH := "./node_modules/.bin:" + env_var('PATH')

dev:
  vite --port 5027

build:
  vite build

deploy: build
  netlify deploy dist/ --prod
