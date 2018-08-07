require 'strscan'

module One
    module Regex
        def Regex.matchFromIndex(pattern, input, offset)
            scanner = StringScanner.new input
            scanner.pos = offset
            return nil if not scanner.scan(Regexp.new pattern)
            
            result = []
            i = 0
            while true do
                curr = scanner[i]
                break if not curr
                result << curr
                i = i + 1
            end
            return result
        end
    end
end