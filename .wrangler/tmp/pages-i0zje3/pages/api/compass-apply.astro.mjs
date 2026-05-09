globalThis.process ??= {}; globalThis.process.env ??= {};
import { R as Resend } from '../../chunks/index_C4yIeQ1U.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
function clean(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
async function parsePayload(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await request.json();
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}
const POST = async ({ request, locals }) => {
  try {
    const payload = await parsePayload(request);
    const name = clean(payload.name);
    const email = clean(payload.email);
    const location = clean(payload.location);
    const experienceLevel = clean(payload.experience_level);
    const currentSituation = clean(payload.current_situation);
    const desiredOutcome = clean(payload.desired_outcome);
    const whyNow = clean(payload.why_now);
    if (!name || !email || !experienceLevel || !currentSituation || !desiredOutcome || !whyNow) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please complete all required fields." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Please enter a valid email address." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    const runtimeEnv = locals?.runtime?.env;
    const apiKey = runtimeEnv?.EMAIL_API_KEY ?? undefined                             ;
    const toEmail = runtimeEnv?.EMAIL_TO ?? undefined                         ?? "hello@tidesofknowing.com";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email service is not configured." }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
    const resend = new Resend(apiKey);
    const textBody = [
      "New COMPASS application received.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Location: ${location || "Not provided"}`,
      `Experience Level: ${experienceLevel}`,
      "",
      "Current Situation:",
      currentSituation,
      "",
      "Desired Outcome:",
      desiredOutcome,
      "",
      "Why Now:",
      whyNow
    ].join("\n");
    await resend.emails.send({
      from: "Tides of Knowing <hello@tidesofknowing.com>",
      to: [toEmail],
      subject: "New COMPASS Application",
      text: textBody,
      replyTo: email
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    console.error("COMPASS application error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Unable to submit right now. Please try again." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
