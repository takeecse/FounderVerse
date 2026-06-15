import socket from "../socket";
import { useEffect, useState } from "react";
import {
    getConversation,
    sendMessage,
    getConversations,
} from "../api/chatApi";
import {
    useParams,
    Link,
} from "react-router-dom";

function Chat() {

    const { userId } = useParams();

    const receiverId = userId;

    const currentUserId =
        JSON.parse(
            atob(
                localStorage
                    .getItem("token")
                    .split(".")[1]
            )
        ).id;

    const [messages, setMessages] =
        useState([]);

    const [conversations,
        setConversations] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const loadMessages = async () => {
        try {

            const res =
                await getConversation(
                    receiverId
                );
            
            console.log(
  "CURRENT USER:",
  currentUserId
);

console.log(
  "RECEIVER:",
  receiverId
);

console.log(
  "MESSAGES:",
  res.data
);

            console.log(res.data);

            setMessages(res.data);

        } catch (error) {
            console.error(error);
        }
    };

    const loadConversations =
        async () => {
            try {

                const res =
                    await getConversations();

                setConversations(
                    res.data
                );

            } catch (error) {
                console.error(error);
            }
        };

    useEffect(() => {
    loadMessages();
    loadConversations();

    const handleReceive = (data) => {

        const belongsToCurrentChat =
            (
                data.sender === receiverId &&
                data.receiver === currentUserId
            ) ||
            (
                data.sender === currentUserId &&
                data.receiver === receiverId
            );

        if (belongsToCurrentChat) {
            setMessages((prev) => [
                ...prev,
                data,
            ]);
        }
    };

    socket.on(
        "receive_message",
        handleReceive
    );

    return () => {
        socket.off(
            "receive_message",
            handleReceive
        );
    };

}, [receiverId, currentUserId]);

    const handleSend =
        async () => {

            if (!message.trim()) return;

            try {

                await sendMessage(
                    receiverId,
                    message
                );

                socket.emit(
    "send_message",
    {
        sender: currentUserId,
        receiver: receiverId,
        message,
    }
);

                setMessage("");

                loadMessages();

            } catch (error) {
                console.error(error);
            }
        };

    return (
        <div className="min-h-screen p-10">

            <div className="grid md:grid-cols-4 gap-6">

                {/* Left Sidebar */}
                <div
                    className="
        bg-[#0B1225]
        p-6
        rounded-2xl
        "
                >
                    <h2 className="text-2xl font-bold mb-6">
                        Conversations
                    </h2>

                    {conversations.map((user) => (

                        <Link
                            key={user._id}
                            to={`/chat/${user._id}`}
                            className={`
              block
              p-3
              rounded-xl
              mb-3
              ${receiverId === user._id
                                    ? "bg-cyan-600"
                                    : "hover:bg-gray-800"
                                }
            `}
                        >
                            {user.name}
                        </Link>

                    ))}

                </div>

                {/* Chat Area */}
                <div
                    className="
        md:col-span-3
        bg-[#0B1225]
        p-6
        rounded-2xl
        "
                >

                    <h1 className="text-3xl font-bold mb-6">
                        Chat
                    </h1>

                    <div
                        className="
          h-[500px]
          overflow-y-auto
          "
                    >

                        {messages.map((msg) => (

                            <div
                                key={msg._id}
                                className={`
      flex
      mb-3
      ${msg.sender === currentUserId
                                        ? "justify-end"
                                        : "justify-start"
                                    }
    `}
                            >

                                <div
                                    className={`
        p-3
        rounded-xl
        max-w-[70%]
        ${msg.sender === currentUserId
                                            ? "bg-cyan-600"
                                            : "bg-gray-800"
                                        }
      `}
                                >
                                    {msg.message}
                                </div>

                            </div>

                        ))}

                    </div>

                    <div className="flex gap-3 mt-4">

                        <input
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            placeholder="Type message..."
                            className="
            flex-1
            p-4
            rounded-xl
            bg-gray-800
            "
                        />

                        <button
                            onClick={handleSend}
                            className="
            bg-cyan-500
            px-6
            rounded-xl
            "
                        >
                            Send
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Chat;