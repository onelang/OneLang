import { GroupManager } from "./Model/GroupManager";
import { StringUtil } from "./Utils/StringUtil";

const gm = new GroupManager();
gm.generateANewGroup();
gm.importGroup('{"name":"importedGroup", "users":[{"name":"imported user1"}]}');
const groupNames = StringUtil.concatTwoStrings(gm.groups[0].name, gm.groups[1].name);
console.log(`Group names: ${groupNames}`);