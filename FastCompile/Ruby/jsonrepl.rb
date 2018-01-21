require 'json'
require 'stringio'

trap 'INT' do exit end
$stdout.sync = true
stdout = $stdout
while requestLine = gets
    begin
        $stdout = StringIO.new
        request = JSON.parse(requestLine)
        eval request['stdlibCode']
        result = eval request['code'].sub(/require 'one'/, "")
        stdout.puts(JSON.generate({ :result => $stdout.string }))
    rescue Exception
        stdout.puts(JSON.generate({ :exceptionText => "#{$@.first}: #{$!.message} (#{$!.class})" + $@.drop(1).map{|s| "\n\t#{s}"}.join("") }))
    ensure
        $stdout = stdout
    end
end
