"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Home() {

  const [user,setUser] = useState<any>(null)
  const [bookmarks,setBookmarks] = useState<any[]>([])
  const [title,setTitle] = useState("")
  const [url,setUrl] = useState("")

  useEffect(() => {
  getUser()

  const channel = supabase
    .channel("bookmarks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookmarks" },
      () => fetchBookmarks()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])


  async function getUser(){
    const { data } = await supabase.auth.getUser()
    if(data.user){
      setUser(data.user)
      fetchBookmarks(data.user)
    }
  }

  async function login(){
    await supabase.auth.signInWithOAuth({
      provider: "google"
    })
  }

  async function fetchBookmarks(currentUser=user){
    if(!currentUser) return

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false})

    setBookmarks(data || [])
  }

  async function addBookmark(){
    if(!title || !url) return

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id:user.id
    })

    setTitle("")
    setUrl("")
  }

  async function deleteBookmark(id:string){
    await supabase.from("bookmarks").delete().eq("id",id)
  }

  if(!user)
    return(
      <div className="p-10">
        <h2 className="text-xl mb-4">Smart Bookmark App</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={login}
        >
          Login with Google
        </button>
      </div>
    )

  return(
    <div className="p-10">
      <h2 className="text-xl mb-4">Smart Bookmark App</h2>

      <input
        className="border p-2 mr-2"
        placeholder="Title"
        value={title}
        onChange={e=>setTitle(e.target.value)}
      />

      <input
        className="border p-2 mr-2"
        placeholder="URL"
        value={url}
        onChange={e=>setUrl(e.target.value)}
      />

      <button
        className="bg-green-500 text-white px-3 py-2"
        onClick={addBookmark}
      >
        Add
      </button>

      <ul className="mt-6">
        {bookmarks.map(b=>(
          <li key={b.id} className="mb-2">
            <a href={b.url} target="_blank" className="mr-3 text-blue-600">
              {b.title}
            </a>
            <button
              className="bg-red-500 text-white px-2 py-1"
              onClick={()=>deleteBookmark(b.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
