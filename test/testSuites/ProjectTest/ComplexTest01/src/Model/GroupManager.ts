import { OneJson } from "One.Json-v0.1";

import { Group } from "./Db/Group";
import { User } from "./Db/User";
import { StringUtil } from "../Utils/StringUtil";
import { List } from "../Utils/List";

export class GroupManager {
    public groups = new List<Group>();

    generateANewGroup(): void {
        const g = new Group();
        g.name = "MyGroup";
        g.users = [new User("user1"), new User("user2")];
        this.groups.add(g);
    }

    importGroup(exportedJson: string): void {
        const g = <Group> OneJson.deserialize(exportedJson);
        g.name = StringUtil.ucFirst(g.name);
        this.groups.add(g);
    }
}