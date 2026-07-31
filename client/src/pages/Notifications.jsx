import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCheck } from "react-icons/fa6";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../api/notificationApi";
import socket, { connectSocket } from "../socket";

function Notifications() {
  const [notifications, setNotifications] =
    useState([]);

  const markVisibleNotificationsRead = useCallback(
    async () => {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
      window.dispatchEvent(
        new Event("founderverse:notifications-read")
      );
    },
    []
  );

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        setNotifications(res.data);
        await markVisibleNotificationsRead();
      } catch (error) {
        console.error(error);
      }
    };

    fetchNotifications();
  }, [markVisibleNotificationsRead]);

  useEffect(() => {
    connectSocket();

    const handleNewNotification = (notification) => {
      setNotifications((current) => {
        if (
          current.some(
            (item) => item._id === notification._id
          )
        ) {
          return current;
        }

        return [
          {
            ...notification,
            isRead: true,
          },
          ...current,
        ];
      });

      markVisibleNotificationsRead().catch((error) =>
        console.error(error)
      );
    };

    const handleReadAll = () => {
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    };

    socket.on(
      "notification:new",
      handleNewNotification
    );
    socket.on(
      "notifications:read-all",
      handleReadAll
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );
      socket.off(
        "notifications:read-all",
        handleReadAll
      );
    };
  }, [markVisibleNotificationsRead]);

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder signals</p>
          <h1 className="page-title">
            Notifications
          </h1>
          <p className="page-subtitle">
            Track collaboration requests, accepted matches, and
            updates tied to your account.
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Dashboard
        </Link>
      </div>

      {notifications.length === 0 ? (
        <section className="glass-panel p-8 text-center">
          <FaBell className="mx-auto text-3xl text-cyan-200" />
          <h2 className="mt-4 text-2xl font-black">
            No notifications
          </h2>
          <p className="mt-2 text-slate-400">
            New request and connection activity will appear here.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {notifications.map((item) => (
            <article
              key={item._id}
              className={`glass-card p-6 ${
                item.isRead
                  ? ""
                  : "border-cyan-300/50 bg-cyan-300/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                  <FaCheck />
                </div>
                <div>
                  <h2 className="text-xl font-black">
                    {item.title}
                  </h2>
                  <p className="mt-2 leading-6 text-slate-400">
                    {item.message}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default Notifications;
