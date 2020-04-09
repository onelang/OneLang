export class NameUtils {
    static shortName(fullName: string): string {
        const nameParts: string[] = [];
        let partStartIdx = 0;
        for (let i = 1; i < fullName.length; i++) {
            const chrCode = fullName.charCodeAt(i);
            const chrIsUpper = 65 <= chrCode && chrCode <= 90;
            if (chrIsUpper) {
                nameParts.push(fullName.substring(partStartIdx, i));
                partStartIdx = i;
            }
        }
        nameParts.push(fullName.substr(partStartIdx));

        const shortNameParts: string[] = [];
        for (let i = 0; i < nameParts.length; i++) {
            let p = nameParts[i];
            if (p.length > 5) {
                let cutPoint = 3;
                for (; cutPoint <= 4; cutPoint++)
                    if ("aeoiu".includes(p[cutPoint]))
                        break;
                p = p.substr(0, cutPoint);
            }
            shortNameParts.push(i === 0 ? p.toLowerCase() : p);
        }

        let shortName = shortNameParts.join('');
        if (fullName.endsWith("s") && !shortName.endsWith("s"))
            shortName += "s";
        return shortName;
    }
}