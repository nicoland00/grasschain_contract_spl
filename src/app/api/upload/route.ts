import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

// This route will handle the "client upload" flow: generating tokens
// and receiving the "upload completed" webhook from Vercel Blob.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      // Called before generating the token for the browser:
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Parse clientPayload if it's a string
        const payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : clientPayload;

        return {
          // The MIME types you allow to be uploaded
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          // tokenPayload is a string that is returned to you on 'onUploadCompleted'
          tokenPayload: JSON.stringify({
            // e.g. you can store user id or any info
            userId: payload?.userId ?? 'anonymous',
          }),
        };
      },
      // Called by Vercel Blob after the upload is fully complete
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is only called if Vercel Blob can reach your route publicly
        // (i.e. not "localhost:3000"). Use a tunnel or deploy to see it in action.
        console.log('Upload completed:', blob.url);
        console.log('tokenPayload:', tokenPayload);

        // e.g. store blob.url in your database
        // const { userId } = JSON.parse(tokenPayload);
        // await db.updateUserAvatar(userId, blob.url);
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
