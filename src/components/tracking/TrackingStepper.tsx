// src/components/tracking/TrackingStepper.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { upload } from "@vercel/blob/client";
import { useNotifications, TNotification } from "@/hooks/useNotifications";

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

  const { publicKey } = useWallet();
  const ADMIN_PUBKEY = "74bwEVrLxoWtg8ya7gB1KKKuff9wnNADys1Ss1cxsEdd";
  const isAdmin = publicKey?.toBase58() === ADMIN_PUBKEY;

  const {
    all: notes,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useNotifications(`?contract=${contractId}`);


  // modal open state
  const [modalOpen, setModalOpen] = useState(false);

  // track which IDs the user has already seen
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const hasUnseen = notes.some((n) => !seen.has(n._id));

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState<TNotification | null>(null);

  // when opening modal, mark everything as seen
  useEffect(() => {
    if (modalOpen) {
      setSeen(new Set(notes.map((n) => n._id)));
    }
  }, [modalOpen, notes]);

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

        {isAdmin && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="relative w-3/4 md:w-1/2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              Manage Updates
              {hasUnseen && (
                <span
                  className="absolute top-2 right-4 block w-3 h-3 bg-red-500 rounded-full"
                  aria-label="New updates"
                />
              )}
            </button>
          </div>
        )}
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
                        {n.attachments?.map((a, i) => (
                          a.contentType.startsWith("video") ? (
                            <video key={i} controls className="mt-2 rounded-lg" src={a.url} />
                          ) : (
                            <img key={i} className="mt-2 rounded-lg" src={a.url} alt="attachment" />
                          )
                        ))}
                        {isAdmin && (
                          <div className="mt-2 flex gap-2">
                            <button className="btn btn-xs" onClick={() => {
                              setEditing(n);
                              setTitle(n.title);
                              setMessage(n.message);
                            }}>
                              Editar
                            </button>
                            <button className="btn btn-xs btn-error" onClick={() => deleteNotification(n._id, publicKey!.toBase58())}>Eliminar</button>
                          </div>
                        )}
                      </div>
                    ))
                )}

{isAdmin && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const uploaded = [] as { url: string; contentType: string }[];
                    for (const f of files) {
                      const r = await upload(f.name, f, { access: "public", handleUploadUrl: "/api/upload" });
                      uploaded.push({ url: r.url, contentType: f.type });
                    }
                    if (editing) {
                      await updateNotification(editing._id, {
                        title,
                        message,
                        contract: contractId,
                        attachments: uploaded,
                        adminPubkey: publicKey!.toBase58(),
                      });
                    } else {
                      await createNotification({
                        title,
                        message,
                        contract: contractId,
                        stage: "active",
                        attachments: uploaded,
                        adminPubkey: publicKey!.toBase58(),
                      });
                    }
                    setTitle("");
                    setMessage("");
                    setFiles([]);
                    setEditing(null);
                  }} className="pt-4 space-y-2">
                    <h3 className="font-semibold">{editing ? "Edit Update" : "New Update"}</h3>
                    <input className="input input-bordered w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
                    <textarea className="textarea textarea-bordered w-full" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" required />
                    <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                    <div className="flex gap-2">
                      {editing && <button type="button" className="btn btn-sm" onClick={() => {setEditing(null); setTitle(""); setMessage(""); setFiles([]);}}>Cancel</button>}
                      <button type="submit" className="btn btn-primary btn-sm">{editing ? "Save" : "Publish"}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
