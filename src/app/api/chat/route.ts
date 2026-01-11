import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Chat from "@/models/Chat";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // 1. Check User Session
    const session = await auth();
    const userEmail = session?.user?.email;

    // 2. Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // 3. Get User Message
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    // 4. Call Gemini 2.5 Flash (Your custom model configuration)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: latestMessage }]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ error: data }, { status: response.status });
    }

    const aiContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    // 5. SAVE TO MONGODB (Only if user is logged in)
    if (userEmail) {
      await connectToDatabase();
      await Chat.findOneAndUpdate(
        { userEmail },
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: latestMessage },
                { role: "assistant", content: aiContent },
              ],
            },
          },
        },
        { upsert: true, new: true } // Create history if it doesn't exist
      );
    }

    return NextResponse.json({ content: aiContent });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}