"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // ✅ Fetch Bookmarks
  const fetchBookmarks = async (userId) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookmarks(data);
    }
  };

  // ✅ Auth + Realtime Setup
  useEffect(() => {
    let channel;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);
      await fetchBookmarks(user.id);

      channel = supabase
        .channel(`realtime-bookmarks-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBookmarks(user.id);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // ✅ Login
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // ✅ Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  // ✅ Add Bookmark
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
  };

  // ✅ Delete Bookmark
  const deleteBookmark = async (id) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  // =========================
  // 🔒 Login UI
  // =========================

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Smart Bookmark Manager
          </h1>

          <p className="text-gray-500 mb-8">
            Save and access your favorite links securely from anywhere.
          </p>

          <button
            onClick={login}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition duration-300"
          >
            🚀 Sign in with Google
          </button>

          <p className="text-xs text-gray-400 mt-6">
            Powered by Supabase
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // 📚 Dashboard UI
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
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

        {/* Add Form */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Bookmark Title"
            className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="https://example.com"
            className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button
            onClick={addBookmark}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition"
          >
            Add
          </button>
        </div>

        {/* Bookmark List */}
        <div className="space-y-3">
          {bookmarks.length === 0 && (
            <p className="text-gray-400 text-center py-10">
              No bookmarks yet.
            </p>
          )}

          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex justify-between items-center border rounded-lg p-4 hover:shadow-md transition"
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 font-medium hover:underline"
              >
                {bookmark.title}
              </a>

              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="text-red-500 hover:text-red-700 font-semibold"
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
