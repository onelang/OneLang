import { GroupManager } from "./Model/GroupManager";
import { StringUtil } from "./Utils/StringUtil";

const gm = new GroupManager();
gm.generateANewGroup();
gm.importGroup('{"name":"importedGroup", "users":[{"name":"imported user1"}]}');
const groups = gm.groups.get();
const groupNames = StringUtil.concatTwoStrings(groups[0].name, groups[1].name);
console.log(`Group names: ${groupNames}`);