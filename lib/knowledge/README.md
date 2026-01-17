ollama pull nomic-embed-text

修改文档使用这个更新 curl -X POST http://localhost:3000/api/knowledge/build-index

强制刷新
curl -X POST http://localhost:3000/api/knowledge/build-index \
 -H "Content-Type: application/json" \
 -d '{"force":true}'
