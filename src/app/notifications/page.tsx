// src/app/notifications/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWallet }  from "@solana/wallet-adapter-react";
import { useNotifications, TNotification } from "@/hooks/useNotifications";

const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY!;

export default function NotificationsPage() {
  const { data: session }      = useSession();
  const { publicKey }          = useWallet();
  const isAdmin                = publicKey?.toBase58() === ADMIN_PUBKEY;
  const adminParam             = publicKey?.toBase58() || "";

  // ** NEW **: fetch contracts
  const [contracts, setContracts] = useState<string[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/my-contracts?wallet=${adminParam}`)
      .then((r) => r.json())
      .then((maybeList) => {
        if (Array.isArray(maybeList)) {
          setContracts(maybeList.map((c) => c.contractId));
        } else {
          console.warn("expected array from /api/my-contracts, got:", maybeList);
          setContracts([]);
        }
      })
      .catch((err) => {
        console.error("failed to load contracts:", err);
        setContracts([]);
      });
  }, [isAdmin, adminParam]);
  
  

  const { all, isLoading, isError, createNotification, markAllRead } =
    useNotifications(session?.user?.email ? "" : `?wallet=${publicKey?.toBase58()}`);

  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [contract, setContract] = useState<string>("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createNotification({
      title,
      message,
      contract:    contract || null,
      stage:       "active",
      adminPubkey: adminParam,
    });
    setTitle("");
    setMessage("");
    setContract("");
    markAllRead();
  }

  if (isLoading) return <p>Loading…</p>;
  if (isError)   return <p className="text-red-600">Error loading</p>;

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
          <select
            className="input w-full"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
          >
            <option value="">— GENERAL (everyone) —</option>
            {contracts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn btn-primary">Publish</button>
        </form>
      )}

      <ul className="space-y-4">
        {all.map((n: TNotification) => (
          <li key={n._id} className="bg-white p-4 rounded shadow">
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
