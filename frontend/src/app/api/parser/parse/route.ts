import { NextResponse } from "next/server";

import { BACKEND_URL } from "@/constants/constants";
import { refreshToken } from "@/lib/auth/auth";
import { getSession, updateTokens } from "@/lib/auth/session";

const uploadToParser = async (file: File, accessToken: string) => {
  const proxyFormData = new FormData();
  proxyFormData.append("file", file, file.name);

  return fetch(`${BACKEND_URL}/api/parser/parse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: proxyFormData,
  });
};

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    let response = await uploadToParser(file, session.accessToken);

    if (response.status === 401 && session.refreshToken) {
      const refreshedTokens = await refreshToken(session.refreshToken);

      if (refreshedTokens?.accessToken) {
        await updateTokens({
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
        });

        response = await uploadToParser(file, refreshedTokens.accessToken);
      }
    }

    const contentType = response.headers.get("content-type") ?? "";
    const responseBody = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        responseBody ?? { message: "Upload failed" },
        { status: response.status }
      );
    }

    if (contentType.includes("application/json")) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    return new NextResponse(
      typeof responseBody === "string" ? responseBody : "",
      {
        status: response.status,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to upload document",
        errors: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
