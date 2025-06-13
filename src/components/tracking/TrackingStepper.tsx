// src/components/tracking/TrackingStepper.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotifications, TNotification } from "@/hooks/useNotifications";
import { useWallet } from "@solana/wallet-adapter-react";
import { upload } from "@vercel/blob/client";

const ADMIN_PUBKEY = process.env.NEXT_PUBLIC_ADMIN_PUBKEY!;

export type StageKey =
  | "bought"
  | "verification"
  | "active"
  | "settling"
  | "settled"
  | "defaulted";

const STEP_ORDER: StageKey[] = [
  "bought",
  "verification",
  "active",
  "settling",
  "settled",
];

interface Props {
  current: StageKey;
  contractId: string;
}

export function TrackingStepper({ current, contractId }: Props) {
  // normalize
  const effective = current === "defaulted" ? "settled" : current;
  const idx = STEP_ORDER.indexOf(effective);

  // fetch all notifications for this contract
  const { publicKey } = useWallet();
  const isAdmin = publicKey?.toBase58() === ADMIN_PUBKEY;
  const adminParam = publicKey?.toBase58() || "";

  const {
    all: notes,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useNotifications(`?contract=${contractId}`);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  // modal open state
  const [modalOpen, setModalOpen] = useState(false);

  // track which IDs the user has already seen
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const hasUnseen = notes.some((n) => !seen.has(n._id));

  // when opening modal, mark everything as seen
  useEffect(() => {
    if (modalOpen) {
      setSeen(new Set(notes.map((n) => n._id)));
    }
  }, [modalOpen, notes]);

  function startNew() {
    setEditId(null);
    setTitle("");
    setMessage("");
    setMediaUrls([]);
    setFormOpen(true);
  }

  function startEdit(n: TNotification) {
    setEditId(n._id);
    setTitle(n.title);
    setMessage(n.message);
    setMediaUrls(n.mediaUrls || []);
    setFormOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setMediaUrls((m) => [...m, result.url]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      title,
      message,
      contract: contractId,
      mediaUrls,
      adminPubkey: adminParam,
    };
    if (editId) {
      await updateNotification(editId, body);
    } else {
      await createNotification(body);
    }
    setFormOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete update?")) return;
    await deleteNotification(id, adminParam);
  }


  return (
    <>
      <section className="step-wizard relative overflow-visible">
        {/* 1) Step circles */}
        <ul className="step-wizard-list mb-4 text-xs">
          {STEP_ORDER.map((step, i) => {
            let cls: "ready" | "done" | "wip" = "ready";
            if (i < idx) cls = "done";
            else if (i === idx) cls = "wip";
            return (
              <li key={step} className={`step-wizard-item ${cls}`}>
                <span className="progress-count">{i + 1}</span>
                <span className="progress-label">{step}</span>
              </li>
            );
          })}
        </ul>

        {/* 2) Show updates button */}
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setModalOpen(true)}
            className="relative w-3/4 md:w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Show updates
            {hasUnseen && (
              <span
                className="absolute top-2 right-4 block w-3 h-3 bg-red-500 rounded-full"
                aria-label="New updates"
              />
            )}
          </button>
        </div>
      </section>

      {/* 3) Modal via portal */}
      {modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg overflow-hidden max-w-lg w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <h2 className="text-lg font-semibold">Updates</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* content */}
              <div className="overflow-y-auto p-4 space-y-4">
              {isAdmin && !formOpen && (
                  <button
                    onClick={startNew}
                    className="mb-4 px-3 py-2 rounded bg-green-500 text-white"
                  >
                    Add update
                  </button>
                )}

                {formOpen && (
                  <form onSubmit={handleSubmit} className="space-y-2 mb-4">
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
                      type="file"
                      ref={fileRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                    />
                    <div className="flex flex-wrap gap-2">
                      {mediaUrls.map((url) => (
                        <span key={url} className="text-xs break-all">
                          {url}
                        </span>
                      ))}
                    </div>
                    <div className="space-x-2">
                      <button className="btn btn-primary" type="submit">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {notes.length === 0 ? (
                  <p className="text-center text-gray-500">No updates yet</p>
                ) : (
                  notes
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((n: TNotification) => (
                      <div key={n._id} className="flex flex-col border-b pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{n.title}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{n.message}</p>
                        {n.mediaUrls?.map((u) => (
                          u.match(/\.mp4|\.mov$/i) ? (
                            <video key={u} controls className="mt-2 max-h-48">
                              <source src={u} />
                            </video>
                          ) : (
                            <img
                              key={u}
                              src={u}
                              alt="media"
                              className="mt-2 max-h-48 object-contain"
                            />
                          )
                        ))}
                        {isAdmin && (
                          <div className="mt-1 space-x-2">
                            <button
                              onClick={() => startEdit(n)}
                              className="text-blue-600 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(n._id)}
                              className="text-red-600 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
