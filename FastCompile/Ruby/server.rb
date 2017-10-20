require 'webrick'
require 'json'
require 'stringio'

nullLog = WEBrick::Log.new(File.open(File::NULL, 'w'))
server = WEBrick::HTTPServer.new :Port => 8005, :AccessLog => [], :BindAddress => "127.0.0.1", :Logger => nullLog
trap 'INT' do server.shutdown end

server.mount_proc '/compile' do |req, res|
    original_stdout = $stdout
    begin
        res["Access-Control-Allow-Origin"] = "*"

        $stdout = result_stdout = StringIO.new
        request = JSON.parse(req.body())

        startTime = Time.now
        result = eval request['code']
        elapsedMs = ((Time.now - startTime) * 1000).round
        
        res.body = JSON.generate({ :result => $stdout.string, :elapsedMs => elapsedMs })
    rescue
        res.body = JSON.generate({ :exceptionText => "#{$@.first}: #{$!.message} (#{$!.class})" + $@.drop(1).map{|s| "\n\t#{s}"}.join("") })
    ensure
        $stdout = original_stdout
    end
end

puts "[Ruby] Server listening on 127.0.0.1:8005"
server.start
