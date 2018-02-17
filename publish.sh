cd ../ide.onelang.io
rm -rf js input langs lib src
cd ../onelang
cp -R js input langs lib src index.html ../ide.onelang.io/
cd ../ide.onelang.io/
python ../onelang/publish.py
git add -A && git commit -m "Update (koczkatamas/onelang@`cd ../onelang;git rev-parse HEAD`)"