import { GroupManager } from "./Model/GroupManager";
import { StringUtil } from "./Utils/StringUtil";
import { Group } from "./Model/Db/Group";
import { ArrayUtil } from "./Utils/ArrayUtil";

const gm = new GroupManager();
gm.generateANewGroup();
gm.importGroup('{"name":"importedGroup", "users":[{"name":"imported user1"}]}');
const groups = gm.groups.get();
const newGroup = new Group();
newGroup.name = "NewGroup";
const allGroups = ArrayUtil.concat<Group>(groups, [newGroup]);
const groupNames = StringUtil.concatTwoStrings(groups[0].name, allGroups[2].name);
console.log(`Group names: ${groupNames}`);