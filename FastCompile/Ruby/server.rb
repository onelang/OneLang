require 'webrick'
require 'json'

nullLog = WEBrick::Log.new(File.open(File::NULL, 'w'))
server = WEBrick::HTTPServer.new :Port => 8005, :AccessLog => [], :BindAddress => "127.0.0.1", :Logger => nullLog
trap 'INT' do server.shutdown end

server.mount_proc '/compile' do |req, res|
    res["Access-Control-Allow-Origin"] = "*"
    begin
        request = JSON.parse(req.body())
        code = "#{request['code']}\n#{request['className']}.new().#{request['methodName']}"
        startTime = Time.now
        elapsedMs = ((Time.now - startTime) * 1000).round
        result = eval code
        res.body = JSON.generate({ :result => result, :elapsedMs => elapsedMs })
    rescue
        res.body = JSON.generate({ :exceptionText => "#{$@.first}: #{$!.message} (#{$!.class})" + $@.drop(1).map{|s| "\n\t#{s}"}.join("") })
    end
end

puts "[Ruby] Server listening on 127.0.0.1:8005"
server.start
