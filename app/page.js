"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= FETCH BOOKMARKS =================

  const fetchBookmarks = async (userId) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) {
      setBookmarks(data || []);
    } else {
      console.error("Fetch error:", error.message);
    }
  };

  // ================= INITIAL LOAD =================

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchBookmarks(session.user.id);
      }

      setLoading(false);
    };

    getUser();
  }, []);

  // ================= LOGIN =================

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  // ================= LOGOUT =================

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  // ================= ADD =================

  const addBookmark = async () => {
    if (!title || !url || !user) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        {
          title,
          url,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Insert error:", error.message);
      return;
    }

    if (data) {
      setBookmarks((prev) => [data[0], ...prev]);
      setTitle("");
      setUrl("");
    }
  };

  // ================= DELETE =================

  const deleteBookmark = async (id) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error.message);
      return;
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  // ================= LOGIN SCREEN =================

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white shadow-2xl rounded-3xl p-12 w-full max-w-md text-center border">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
            Smart Bookmark
          </h1>
          <p className="text-gray-500 mb-8">
            Save and manage your links securely.
          </p>
          <button
            onClick={login}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition"
          >
            🚀 Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-3xl p-10 border">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {user.email}
            </h2>
            <p className="text-gray-500 text-sm">
              {bookmarks.length} bookmarks
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl transition"
          >
            Logout
          </button>
        </div>

        {/* Add Form */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Bookmark Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <button
            onClick={addBookmark}
            className="bg-green-500 hover:bg-green-600 text-white px-6 rounded-xl transition"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {bookmarks.length === 0 && (
            <p className="text-center text-gray-400 py-10">
              No bookmarks yet
            </p>
          )}

          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center border rounded-xl p-4 hover:shadow-md transition"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline"
              >
                {b.title}
              </a>
              <button
                onClick={() => deleteBookmark(b.id)}
                className="text-red-500 font-medium hover:text-red-700"
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
