cd ../ide.onelang.io
rm -rf js input langs lib src
cd ../onelang
cp -R js input langs lib src ../ide.onelang.io/
cd ../ide.onelang.io/
git commit -am "Update (koczkatamas/onelang@`cd ../onelang;git rev-parse HEAD`)"