require 'json'
require 'stringio'

trap 'INT' do exit end
$stdout.sync = true
$realStdout = $stdout
    
def resp(result)
    result["backendVersion"] = "one:ruby:jsonrepl:20180122"
    $realStdout.puts(JSON.generate(result))
end

while requestLine = gets
    begin
        $stdout = StringIO.new
        request = JSON.parse(requestLine)
        eval request['stdlibCode']
        result = eval request['code'].sub(/require 'one'/, "")
        resp({ :result => $stdout.string })
    rescue Exception
        resp({ :exceptionText => "#{$@.first}: #{$!.message} (#{$!.class})" + $@.drop(1).map{|s| "\n\t#{s}"}.join("") })
    ensure
        $stdout = $realStdout
    end
end
