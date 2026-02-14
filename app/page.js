"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
  let channel;

  const setup = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);
    fetchBookmarks();

    channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();
  };

  setup();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, []);
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  const addBookmark = async () => {
    if (!title || !url) return;

    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ]);

    setTitle("");
    setUrl("");
    fetchBookmarks();
  };

  const deleteBookmark = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
  };

  /* ================= LOGIN SCREEN ================= */

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 sm:p-10 w-full max-w-md text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Smart Bookmark Manager
          </h1>

          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            Save, organize and access your favorite links securely from anywhere.
          </p>

          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300"
          >
            🚀 Sign in with Google
          </button>

          <p className="text-xs text-gray-400 mt-6">
            Secure login powered by Supabase
          </p>
        </div>
      </div>
    );
  }

  /* ================= DASHBOARD ================= */

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 sm:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-all">
              Welcome, {user.email}
            </h2>
            <p className="text-gray-500 text-sm">
              Total Bookmarks: {bookmarks.length}
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Add Bookmark Form */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Bookmark Title"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="https://example.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={addBookmark}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition"
          >
            Add
          </button>
        </div>

        {/* Bookmark List */}
        <div className="space-y-4">
          {bookmarks.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              No bookmarks yet. Add your first one 🚀
            </p>
          )}

          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 border rounded-lg p-4 hover:shadow-md transition"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline break-all mb-2 sm:mb-0"
              >
                {b.title}
              </a>

              <button
                onClick={() => deleteBookmark(b.id)}
                className="text-red-500 hover:text-red-600 font-medium"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
