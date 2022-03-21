const Notifications = require('../notifications/models/notifications.model');
class NotificationsService {

    static connectSocket(io, socket) {
        this.io = io;
        this.socket = socket;

        this.socket.on("get_notification_pending", data => {
            const verify_token_result = VerifyTokenSocket(data.token);

            const new_friend_request_total = NotificationsService.countNotificationType("new_friend_request");
            const total_notification = NotificationsService.countNotificationType("");
            this.socket.emit("update_notification_count", {
                'total_notification': total_notification,
                'new_friend_request_total': new_friend_request_total
            });
        });
    }

    static sendNotififcation(data) {
        Notifications.create({
            'from_id': data.from_id,
            'to_id': data.to_id,
            'object_id': data.object_id,
            'type': data.type,
            'message': data.message,
            'status': false
        }).then(result => {

            this.io.emit("update_notification", result);
        });
    }



    async countNotificationType(type) {
        var filter = {};
        filter.status = false;
        if (type != "") {
            filter.type = type;
        }

        return await Notifications.find(filter).then(result => {
            return result.length;
        });
    }



}
module.exports = NotificationsService;