@echo off
echo Starting local server at http://localhost:8080
start http://localhost:8080/menu.html
python -m http.server 8080
pause

git config --global user.name "phamlequynh"
git config --global user.email "quynhletkdn@gmail.com"