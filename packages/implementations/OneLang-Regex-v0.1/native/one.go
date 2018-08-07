package one

import "strings"
import "regexp"

func Regex_MatchFromIndex(pattern string, input string, offset int) []string {
	reader := strings.NewReader(input)
	reader.Seek(int64(offset), 0)

	re := regexp.MustCompile("^" + pattern)
	matchIndices := re.FindReaderSubmatchIndex(reader)

	if matchIndices == nil {
		return nil
	}

	groupCount := len(matchIndices) / 2
	result := make([]string, groupCount)		
    for i := 0; i < groupCount; i++ {
        result[i] = input[offset + matchIndices[i * 2 + 0] : offset + matchIndices[i * 2 + 1]]
    }

    return result
}
