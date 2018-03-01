import Foundation

class OneRegex { 
    class func matchFromIndex(pattern: String, input: String, offset: Int) -> [String]? {
        let regex = try! NSRegularExpression(pattern: "^" + pattern)
        guard let match = regex.firstMatch(in: input, range: NSMakeRange(offset, input.utf16.count - offset)) else { return nil }
        
        var results = [String]()
        for i in 0 ... match.numberOfRanges - 1 {
            let range = match.range(at: i)
            let groupValue = input.substring(with: Range(range, in: input)!)
            results.append(groupValue)
        }
        return results
    }
}
