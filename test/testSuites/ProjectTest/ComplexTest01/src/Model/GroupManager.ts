import { OneJson } from "One.Json-v0.1";

import { Group } from "./Db/Group";
import { User } from "./Db/User";
import { StringUtil } from "../Utils/StringUtil";

export class GroupManager {
    public groups: Group[] = [];

    generateANewGroup() {
        const g = new Group();
        g.name = "MyGroup";
        g.users = [new User("user1"), new User("user2")];
        this.groups.push(g);
    }

    importGroup(exportedJson: string) {
        const g = <Group> OneJson.deserialize(exportedJson);
        g.name = StringUtil.ucFirst(g.name);
        this.groups.push(g);
    }
}