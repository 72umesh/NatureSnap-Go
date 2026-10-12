async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export function snapPhoto(photo, note, minutes) {
  return postJson("/api/snap", {
    image: photo.base64,
    mimeType: "image/jpeg",
    note: note.trim(),
    minutes: minutes ?? undefined,
  });
}

export function reportAnswer(result, reason) {
  return postJson("/api/report", {
    reason,
    title: result.title,
    confidence: result.confidence,
    model: result.model,
    trace: result.trace,
  });
}

export function completeMission({ firstPhoto, secondPhoto, result }) {
  return postJson("/api/complete", {
    firstImage: firstPhoto.base64,
    secondImage: secondPhoto.base64,
    mission: result.mission,
    title: result.title,
  });
}
