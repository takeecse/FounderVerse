import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { getRoleLabel } from "../utils/roles";
import {
  FaArrowLeft,
  FaBan,
  FaMagnifyingGlass,
  FaPaperPlane,
  FaUser,
  FaUserGroup,
  FaUnlock,
} from "react-icons/fa6";
import socket, { connectSocket } from "../socket";
import {
  getConversation,
  getConversations,
  markConversationRead,
  sendMessage,
} from "../api/chatApi";
import { blockUser, getUserById, unblockUser } from "../api/userApi";
import { getCurrentUserId } from "../utils/session";

const timeLabel = (date) =>
  date
    ? new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const MESSAGE_PAGE_SIZE = 50;

const normalizeConversationResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      messages: data,
      hasMore: false,
      nextCursor: data[0]?.createdAt || null,
    };
  }

  return {
    messages: data.messages || [],
    hasMore: Boolean(data.hasMore),
    nextCursor: data.nextCursor || null,
  };
};

function Chat() {
  const { userId } = useParams();
  const currentUserId = getCurrentUserId();
  const hasActiveChat = Boolean(userId);
  const isSelfChat = hasActiveChat && currentUserId === userId;
  const scrollRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [conversationSearch, setConversationSearch] =
    useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] =
    useState(false);
  const [hasMoreMessages, setHasMoreMessages] =
    useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [sending, setSending] = useState(false);
  const [updatingBlock, setUpdatingBlock] = useState(false);

  const conversationUsers = useMemo(() => {
    if (
      activeUser &&
      !conversations.some(
        (item) => item._id === activeUser._id
      )
    ) {
      return [activeUser, ...conversations];
    }

    return conversations;
  }, [activeUser, conversations]);

  const filteredConversationUsers = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();

    if (!query) {
      return conversationUsers;
    }

    return conversationUsers.filter((user) =>
      [
        user.name,
        user.email,
        getRoleLabel(user),
        user.lastMessage,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query)
        )
    );
  }, [conversationSearch, conversationUsers]);

  const addMessage = useCallback((nextMessage) => {
    setMessages((prev) => {
      if (
        prev.some(
          (item) => item._id === nextMessage._id
        )
      ) {
        return prev;
      }

      return [...prev, nextMessage];
    });
  }, []);

  const updateConversationPreview = useCallback(
    (nextMessage, options = {}) => {
      const peerId =
        nextMessage.sender === currentUserId
          ? nextMessage.receiver
          : nextMessage.sender;

      const shouldCountUnread =
        !options.markRead &&
        nextMessage.receiver === currentUserId &&
        nextMessage.sender !== currentUserId &&
        (!hasActiveChat || peerId !== userId);

      setConversations((prev) => {
        let matched = false;
        const next = prev.map((user) => {
          if (user._id !== peerId) {
            return user;
          }

          matched = true;

          return {
            ...user,
            lastMessage: nextMessage.message,
            lastMessageAt:
              nextMessage.createdAt || new Date().toISOString(),
            unreadCount: options.markRead
              ? 0
              : shouldCountUnread
                ? (user.unreadCount || 0) + 1
                : user.unreadCount || 0,
          };
        });

        if (
          !matched &&
          activeUser?._id === peerId
        ) {
          next.unshift({
            ...activeUser,
            lastMessage: nextMessage.message,
            lastMessageAt:
              nextMessage.createdAt || new Date().toISOString(),
            unreadCount: shouldCountUnread ? 1 : 0,
          });
        }

        return next.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0) -
            new Date(a.lastMessageAt || 0)
        );
      });
    },
    [
      activeUser,
      currentUserId,
      hasActiveChat,
      userId,
    ]
  );

  const loadChat = useCallback(
    async (options = {}) => {
      const showLoading = !options.silent;

      if (!hasActiveChat) {
        try {
          if (showLoading) {
            setLoading(true);
          }

          const conversationsRes =
            await getConversations();

          setMessages([]);
          setHasMoreMessages(false);
          setNextCursor(null);
          setConversations(conversationsRes.data);
          setActiveUser(null);
          window.dispatchEvent(
            new Event("founderverse:chat-updated")
          );
        } catch (error) {
          console.error(error);
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }

        return;
      }

      if (isSelfChat) {
        setMessages([]);
        setHasMoreMessages(false);
        setNextCursor(null);
        setActiveUser(null);
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        shouldStickToBottomRef.current = true;
        const [conversationsRes, userRes] = await Promise.all([
          getConversations(),
          getUserById(userId),
        ]);

        setConversations(conversationsRes.data);
        setActiveUser(userRes.data);

        if (userRes.data.isBlockedByMe || userRes.data.hasBlockedMe) {
          setMessages([]);
          setHasMoreMessages(false);
          setNextCursor(null);
          return;
        }

        const messagesRes = await getConversation(userId, {
          limit: MESSAGE_PAGE_SIZE,
        });
        const payload = normalizeConversationResponse(messagesRes.data);

        setMessages(payload.messages);
        setHasMoreMessages(payload.hasMore);
        setNextCursor(payload.nextCursor);
        window.dispatchEvent(
          new Event("founderverse:chat-updated")
        );
      } catch (error) {
        if (error.response?.data?.code === "USER_BLOCKED") {
          setMessages([]);
          setHasMoreMessages(false);
          setNextCursor(null);
          setActiveUser((current) => current ? { ...current, hasBlockedMe: true } : current);
          setLoading(false);
          return;
        }
        console.error(error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [userId, hasActiveChat, isSelfChat]
  );

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) {
        loadChat();
      }
    });

    return () => {
      active = false;
    };
  }, [loadChat]);

  useEffect(() => {
    if (isSelfChat || !currentUserId) return;

    connectSocket();

    const refreshAfterReconnect = () => {
      loadChat({
        silent: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        connectSocket();
        refreshAfterReconnect();
      }
    };

    const handleReceive = (data) => {
      const belongsToCurrentChat =
        hasActiveChat &&
        ((data.sender === userId &&
          data.receiver === currentUserId) ||
          (data.sender === currentUserId &&
            data.receiver === userId));

      if (belongsToCurrentChat) {
        shouldStickToBottomRef.current = true;
        addMessage(data);
        updateConversationPreview(data, {
          markRead: data.receiver === currentUserId,
        });

        if (
          data.receiver === currentUserId &&
          data.sender !== currentUserId
        ) {
          markConversationRead(userId).catch((error) =>
            console.error(error)
          );
        }

        window.dispatchEvent(
          new Event("founderverse:chat-updated")
        );

        return;
      }

      getConversations()
        .then((res) => {
          setConversations(res.data);
          window.dispatchEvent(
            new Event("founderverse:chat-updated")
          );
        })
        .catch((error) => console.error(error));
    };

    const handleReadUpdate = (data) => {
      if (data?.conversationUserId) {
        setConversations((prev) =>
          prev.map((user) =>
            user._id === data.conversationUserId
              ? { ...user, unreadCount: 0 }
              : user
          )
        );
        window.dispatchEvent(
          new Event("founderverse:chat-updated")
        );
        return;
      }

      getConversations()
        .then((res) => {
          setConversations(res.data);
          window.dispatchEvent(
            new Event("founderverse:chat-updated")
          );
        })
        .catch((error) => console.error(error));
    };

    const handleBlockUpdate = (data) => {
      if ([data?.userA, data?.userB].includes(currentUserId) && [data?.userA, data?.userB].includes(userId)) {
        loadChat({ silent: true });
        window.dispatchEvent(new Event("founderverse:chat-updated"));
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("messages_read", handleReadUpdate);
    socket.on("user:block-updated", handleBlockUpdate);
    socket.on("connect", refreshAfterReconnect);
    window.addEventListener(
      "focus",
      refreshAfterReconnect
    );
    window.addEventListener("online", connectSocket);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("messages_read", handleReadUpdate);
      socket.off("user:block-updated", handleBlockUpdate);
      socket.off("connect", refreshAfterReconnect);
      window.removeEventListener(
        "focus",
        refreshAfterReconnect
      );
      window.removeEventListener("online", connectSocket);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    addMessage,
    loadChat,
    updateConversationPreview,
    userId,
    currentUserId,
    hasActiveChat,
    isSelfChat,
  ]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) {
      shouldStickToBottomRef.current = true;
      return;
    }

    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const handleLoadOlder = async () => {
    if (
      !hasActiveChat ||
      !hasMoreMessages ||
      !nextCursor ||
      loadingOlder
    ) {
      return;
    }

    try {
      setLoadingOlder(true);
      shouldStickToBottomRef.current = false;

      const res = await getConversation(userId, {
        limit: MESSAGE_PAGE_SIZE,
        before: nextCursor,
      });
      const payload = normalizeConversationResponse(res.data);

      setMessages((current) => {
        const existingIds = new Set(
          current.map((item) => item._id)
        );

        return [
          ...payload.messages.filter(
            (item) => !existingIds.has(item._id)
          ),
          ...current,
        ];
      });
      setHasMoreMessages(payload.hasMore);
      setNextCursor(payload.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (isSelfChat || !hasActiveChat) return;

    if (!message.trim()) return;

    try {
      setSending(true);
      const res = await sendMessage(
        userId,
        message.trim()
      );

      shouldStickToBottomRef.current = true;
      addMessage(res.data);
      updateConversationPreview(res.data, {
        markRead: true,
      });
      setMessage("");
      window.dispatchEvent(
        new Event("founderverse:chat-updated")
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Message failed"
      );
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!activeUser) return;
    try {
      setUpdatingBlock(true);
      if (activeUser.isBlockedByMe) {
        await unblockUser(activeUser._id);
        setActiveUser((current) => ({ ...current, isBlockedByMe: false }));
        window.dispatchEvent(new Event("founderverse:chat-updated"));
        await loadChat();
      } else {
        await blockUser(activeUser._id);
        setActiveUser((current) => ({ ...current, isBlockedByMe: true }));
        setMessages([]);
        setHasMoreMessages(false);
        setNextCursor(null);
        window.dispatchEvent(new Event("founderverse:chat-updated"));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Could not update this block.");
    } finally {
      setUpdatingBlock(false);
    }
  };

  return (
    <div
      className={`page-shell page-wide chat-shell ${
        hasActiveChat ? "active-chat-shell" : ""
      }`}
    >
      <div className="section-head chat-head">
        <div>
          <p className="eyebrow">Private chat</p>
          <h1 className="page-title">
            {activeUser?.name ||
              (hasActiveChat ? "Conversation" : "Chat")}
          </h1>
          <p className="page-subtitle">
            Keep founder conversations focused, secure, and
            connected to your FounderVerse account.
          </p>
        </div>
        <Link
          to="/connections"
          className="btn btn-secondary"
        >
          <FaArrowLeft />
          Connections
        </Link>
      </div>

      {isSelfChat ? (
        <section className="glass-panel p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-2xl text-cyan-200">
            <FaUser />
          </div>
          <h2 className="mt-5 text-3xl font-black">
            You cannot message yourself
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
            This chat is for conversations with other founders.
            Update your profile instead, or choose a connection
            to message.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/profile" className="btn btn-primary">
              My Profile
            </Link>
            <Link
              to="/connections"
              className="btn btn-secondary"
            >
              Connections
            </Link>
          </div>
        </section>
      ) : (
        <section
          className={`chat-layout ${
            hasActiveChat
              ? "has-active-chat"
              : "no-active-chat"
          }`}
        >
        <aside className="chat-sidebar glass-panel flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <FaUserGroup className="text-cyan-200" />
              Conversations
            </h2>
            <label className="relative mt-4 block">
              <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={conversationSearch}
                onChange={(e) =>
                  setConversationSearch(e.target.value)
                }
                placeholder="Search conversations..."
                className="field field-with-icon"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading && conversationUsers.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                Loading conversations...
              </p>
            ) : conversationUsers.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                Start a chat from a founder profile or connection.
              </p>
            ) : filteredConversationUsers.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">
                No conversations match your search.
              </p>
            ) : (
              filteredConversationUsers.map((user) => (
                <Link
                  key={user._id}
                  to={`/chat/${user._id}`}
                  className={`mb-2 flex items-center gap-3 rounded-lg border p-3 transition ${
                    userId === user._id
                      ? "border-cyan-300/50 bg-cyan-300/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <img
                    src={
                      user.photoURL ||
                      `https://ui-avatars.com/api/?name=${user.name}`
                    }
                    alt={user.name}
                    className="avatar h-11 w-11"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user.lastMessage ||
  getRoleLabel(user)}
                    </p>
                  </div>
                  {user.unreadCount > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-2 text-xs font-black text-white">
                      {user.unreadCount}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </aside>

        {hasActiveChat ? (
        <div className="chat-panel glass-panel flex h-full min-h-0 flex-col overflow-hidden">
          <header className="chat-panel-header flex items-center gap-4 border-b border-white/10 p-5">
            <Link
              to="/chat"
              className="chat-mobile-back btn btn-secondary icon-btn"
              title="Back to conversations"
            >
              <FaArrowLeft />
            </Link>
            <img
              src={
                activeUser?.photoURL ||
                `https://ui-avatars.com/api/?name=${activeUser?.name || "Founder"}`
              }
              alt={activeUser?.name || "Founder"}
              className="avatar h-12 w-12"
            />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black">
                {activeUser?.name || "Founder"}
              </h2>
              <p className="truncate text-sm text-slate-400">
               {activeUser ? getRoleLabel(activeUser) : "Collaborator"} -{" "}
                {activeUser?.location || "Remote"}
              </p>
            </div>
            {activeUser && (
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={updatingBlock}
                className={`btn ${activeUser.isBlockedByMe ? "btn-secondary" : "btn-danger"} ml-auto whitespace-nowrap`}
                title={activeUser.isBlockedByMe ? "Unblock this member" : "Block this member"}
              >
                {activeUser.isBlockedByMe ? <FaUnlock /> : <FaBan />}
                <span className="hidden sm:inline">{updatingBlock ? "Saving..." : activeUser.isBlockedByMe ? "Unblock" : "Block"}</span>
              </button>
            )}
          </header>

          {activeUser && (activeUser.isBlockedByMe || activeUser.hasBlockedMe) && (
            <div className="border-b border-rose-300/20 bg-rose-300/5 px-5 py-3 text-sm text-rose-100">
              {activeUser.isBlockedByMe
                ? "You blocked this member. Unblock them to restore messaging."
                : "This member has blocked you. You can no longer access this conversation."}
            </div>
          )}

          <div className="chat-messages min-h-0 flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <h3 className="text-2xl font-black">
                    Start the conversation
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Send a clear, specific note about what you
                    want to build or explore together.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {hasMoreMessages && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="btn btn-secondary"
                    >
                      {loadingOlder
                        ? "Loading..."
                        : "Load older messages"}
                    </button>
                  </div>
                )}
                {messages.map((msg) => {
                  const mine =
                    msg.sender === currentUserId;

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`chat-bubble max-w-[min(78%,620px)] rounded-lg border px-4 py-3 shadow-xl ${
                          mine
                            ? "border-cyan-300/30 bg-cyan-300/15"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-7">
                          {msg.message}
                        </p>
                        <p className="mt-2 text-right text-[11px] font-bold text-slate-500">
                          {timeLabel(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {activeUser && !activeUser.isBlockedByMe && !activeUser.hasBlockedMe ? <form
            onSubmit={handleSend}
            className="chat-composer border-t border-white/10 p-4"
          >
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Type a focused message..."
                className="field"
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="btn btn-primary icon-btn"
                title="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form> : null}
        </div>
        ) : (
        <div className="chat-empty-panel glass-panel flex h-full min-h-0 items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-2xl text-cyan-200">
              <FaUserGroup />
            </div>
            <h2 className="mt-5 text-3xl font-black">
              Choose a conversation
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              Select an existing chat, or start one from a founder
              profile or connection.
            </p>
            <Link
              to="/connections"
              className="btn btn-primary mt-6"
            >
              Connections
            </Link>
          </div>
        </div>
        )}
        </section>
      )}
    </div>
  );
}

export default Chat;

