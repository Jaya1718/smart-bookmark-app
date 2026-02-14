"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

 useEffect(() => {
  const getSessionAndSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      fetchBookmarks();

      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
      };
    }
  };

  getSessionAndSubscribe();
}, []);


  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) fetchBookmarks();
  };

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

  if (!user) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
      
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center">
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Smart Bookmark Manager
        </h1>

        <p className="text-gray-500 mb-8">
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


  return (
    <div className="p-10">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Welcome, {user.email}
        </h2>

        <p className="mb-4 text-gray-600">
          Total Bookmarks: {bookmarks.length}
        </p>


        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Title"
          className="border p-2 mr-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="URL"
          className="border p-2 mr-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={addBookmark}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <div>
        {bookmarks.map((b) => (
          <div
            key={b.id}
            className="flex justify-between border p-3 mb-2 rounded"
          >
            <a href={b.url} target="_blank" rel="noreferrer">
              {b.title}
            </a>
            <button
              onClick={() => deleteBookmark(b.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

