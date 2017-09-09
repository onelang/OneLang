require 'webrick'
require 'json'

server = WEBrick::HTTPServer.new :Port => 8005
trap 'INT' do server.shutdown end

server.mount_proc '/compile' do |req, res|
    request = JSON.parse(req.body())
    res["Access-Control-Allow-Origin"] = "http://127.0.0.1:8000"
    code = "#{request['code']}\n#{request['className']}.new().#{request['methodName']}"
    startTime = Time.now
    elapsedMs = ((Time.now - startTime) * 1000).round
    result = eval code
    res.body = JSON.generate({ :result => result, :elapsedMs => elapsedMs })
end

server.start
