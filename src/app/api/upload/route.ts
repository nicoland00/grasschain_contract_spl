import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // e.g. only allow certain file types
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "video/mp4",
            "video/quicktime",
            "video/webm",
          ],
          // optionally store something in tokenPayload
          tokenPayload: JSON.stringify({ userId: "admin" }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload complete:", blob.url);
        // e.g. store in DB if you want
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
