import { useEffect, useState } from "react";
import {
    getConversation,
    sendMessage,
    getConversations,
} from "../api/chatApi";
import { useParams } from "react-router-dom";

function Chat() {

    const { userId } = useParams();

    const receiverId = userId;

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
    }, [receiverId]);

    const handleSend =
        async () => {
            if (!message.trim()) return;

            try {

                await sendMessage(
                    receiverId,
                    message
                );

                setMessage("");

                loadMessages();

            } catch (error) {
                console.error(error);
            }
        };

    return (
        <div className="min-h-screen p-10">

            <h1 className="text-4xl font-bold mb-8">
                Chat
            </h1>

            <div className="bg-[#0B1225] p-4 rounded-2xl mb-6">

                <h2 className="text-xl font-bold mb-4">
                    Conversations
                </h2>

                {conversations.map((user) => (

                    <div
                        key={user._id}
                        className="mb-3"
                    >
                        {user.name}
                    </div>

                ))}

            </div>

            <div
                className="
        bg-[#0B1225]
        p-6
        rounded-2xl
        h-[500px]
        overflow-y-auto
        "
            >

                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className="mb-4"
                    >
                        {msg.message}
                    </div>
                ))}

            </div>

            <div className="flex gap-3 mt-4">

                <input
                    value={message}
                    onChange={(e) =>
                        setMessage(
                            e.target.value
                        )
                    }
                    placeholder="Type message..."
                    className="
          flex-1
          p-4
          rounded
          bg-gray-800
          "
                />

                <button
                    onClick={handleSend}
                    className="
          bg-cyan-500
          px-6
          rounded
          "
                >
                    Send
                </button>

            </div>

        </div>
    );
}

export default Chat;