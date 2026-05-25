import { NextRequest, NextResponse } from "next/server";

type SefariaTextResponse = {
  ref?: string;
  heRef?: string;
  text?: string | string[];
  he?: string | string[];
  versionTitle?: string;
  versionSource?: string;
  license?: string;
  heVersionTitle?: string;
  heVersionSource?: string;
  heLicense?: string;
  error?: string;
};

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref")?.trim();

  if (!ref) {
    return NextResponse.json(
      { error: "Enter a text reference first." },
      { status: 400 }
    );
  }

  const endpoint = new URL(
    `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}`
  );
  endpoint.searchParams.set("context", "0");
  endpoint.searchParams.set("commentary", "0");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BarmiBuddyTeacherDashboard/1.0",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load that reference from Sefaria." },
      { status: response.status }
    );
  }

  const data = (await response.json()) as SefariaTextResponse;

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 404 });
  }

  const hebrewText = flattenText(data.he);
  const englishText = flattenText(data.text);

  if (!hebrewText) {
    return NextResponse.json(
      { error: "Sefaria did not return Hebrew text for that reference." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ref: data.ref ?? ref,
    heRef: data.heRef ?? "",
    hebrewText,
    englishText,
    attribution: {
      source: "Sefaria",
      url: `https://www.sefaria.org/${encodeURIComponent(data.ref ?? ref)}`,
      englishVersionTitle: stripHtml(data.versionTitle ?? ""),
      englishVersionSource: data.versionSource ?? "",
      englishLicense: data.license ?? "",
      hebrewVersionTitle: stripHtml(data.heVersionTitle ?? ""),
      hebrewVersionSource: data.heVersionSource ?? "",
      hebrewLicense: data.heLicense ?? "",
    },
  });
}

function flattenText(value: SefariaTextResponse["text"]) {
  if (!value) return "";
  const lines = Array.isArray(value) ? value : [value];
  return lines
    .flatMap((line) => flattenNestedText(line))
    .map(stripHtml)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function flattenNestedText(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(flattenNestedText);
  if (typeof value === "string") return [value];
  return [];
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*\{[פס]\}/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
