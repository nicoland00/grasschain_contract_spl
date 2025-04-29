// src/app/notifications/page.tsx
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNotifications } from "@/hooks/useNotifications";


const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY!;

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { publicKey } = useWallet();
  const params = session?.user?.email
    ? ""
    : publicKey
    ? `?wallet=${publicKey.toBase58()}`
    : "";
  const { all, markAllRead } = useNotifications(params);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contract, setContract] = useState<string>("");

  const isAdmin = publicKey?.toBase58() === ADMIN_PUBKEY;
  const adminParam = publicKey?.toBase58();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, contract: contract || null, adminPubkey: adminParam }),
    });
    setTitle("");
    setMessage("");
    setContract("");
    markAllRead();       // clear badge
  }

  React.useEffect(() => {
    // once page loads, clear unread badge
    markAllRead();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      {isAdmin && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold">Create a new notification</h2>
          <input
            className="input w-full"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="textarea w-full"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <input
            className="input w-full"
            placeholder="Contract ID (optional)"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
          />
          <button className="btn btn-primary">Publish</button>
        </form>
      )}

      <ul className="space-y-4">
        {all.map((n) => (
          <li key={n._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <h3 className="font-semibold">{n.title}</h3>
              <span className="text-sm text-gray-500">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2">{n.message}</p>
            {isAdmin && (
              <small className="text-xs text-gray-400">
                {n.contract ? `Contract: ${n.contract}` : "General"}
              </small>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
