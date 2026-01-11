import { auth } from "@/auth";
import ChatInterface from "@/components/chat-interface";
import connectToDatabase from "@/lib/db";
import Chat from "@/models/Chat";

export default async function Home() {
  // 1. Get the current user
  const session = await auth();
  let history = [];

  // 2. If logged in, fetch their chat history from MongoDB
  if (session?.user?.email) {
    try {
      await connectToDatabase();
      const userChat = await Chat.findOne({ userEmail: session.user.email });
      
      if (userChat && userChat.messages) {
        // Convert MongoDB objects to clean JSON for the frontend
        history = userChat.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }

  // 3. Pass the user AND the history to the chat interface
  return <ChatInterface user={session?.user} initialMessages={history} />;
}