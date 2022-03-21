const PropBetsOptions = require("../prop-bets-options/models/prop-bets-options.model");
const UsersService = require('../users/users.service');
const GroupsService = require('../groups/groups.service');
class PropBetsOptionsService {
    static async getAllOptions(section) {
        return await PropBetsOptions.find({ "section": section }).sort("ordering").then(data => {
            return data;
        }).catch(err => {
            return [];
        });
    }
    static async getAllOptionsSendTo(req) {
        const user_id = req.decoded_data.user_id;
        const friends = await UsersService.listAllFriends(user_id);
        const groups = await GroupsService.listAllGroups(user_id);

        return { groups: groups, friends: friends };
    }//end
}
module.exports = PropBetsOptionsService;