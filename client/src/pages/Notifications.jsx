import { useEffect, useState } from "react";
import {
    getNotifications,
    markAllNotificationsRead,
} from "../api/notificationApi";

function Notifications() {
    const [notifications, setNotifications] =
        useState([]);

    useEffect(() => {
        const fetchNotifications =
            async () => {
                try {
                    const res =
                        await getNotifications();

                    setNotifications(res.data);

                } catch (error) {
                    console.error(error);
                }
            };

        fetchNotifications();

        const markRead = async () => {
            try {
                await markAllNotificationsRead();
            } catch (error) {
                console.error(error);
            }
        };

        markRead();
    }, []);

    return (
        <div className="min-h-screen p-10">

            <h1 className="text-5xl font-bold mb-8">
                Notifications
            </h1>

            {notifications.length === 0 ? (
                <p>No notifications</p>
            ) : (
                <div className="space-y-4">

                    {notifications.map((n) => (
                        <div
                            key={n._id}
                            className="
bg-[#0B1225]
p-6
rounded-3xl
border
border-white/10
hover:border-cyan-500/40
transition
"
                        >
                            <h2 className="font-bold text-xl">
                                {n.title}
                            </h2>

                            <p className="text-gray-400 mt-2">
                                {n.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-3">
                                {new Date(n.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default Notifications;