import { useState } from "react";

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function App() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/health");
  const [body, setBody] = useState('{\n  \n}');
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");

  async function sendRequest(event) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setStatus("");

    try {
      const url = `${baseUrl}/${path.replace(/^\/+/, "")}`;
      const response = await fetch(url, {
        method,
        headers: method === "GET" || method === "DELETE" ? {} : { "Content-Type": "application/json" },
        ...(method !== "GET" && method !== "DELETE" && body.trim() ? { body } : {}),
      });
      const text = await response.text();
      let formatted = text;

      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Keep plain-text responses readable.
      }

      setStatus(`${response.status} ${response.statusText}`);
      setResult(formatted || "(empty response)");
    } catch (error) {
      setStatus("Request failed");
      setResult(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="header">
        <div className="brand-mark">F</div>
        <div>
          <p className="eyebrow">FAIRMATCH · DEVELOPER TOOL</p>
          <h1>API tester</h1>
        </div>
      </header>

      <section className="panel">
        <p className="intro">
          Send a request to the backend and inspect its response. This is a lightweight
          development client; it does not include app or account logic.
        </p>
        <form onSubmit={sendRequest}>
          <label htmlFor="base-url">API base URL</label>
          <div className="base-url" id="base-url">{baseUrl}</div>

          <label htmlFor="request-path">Endpoint path</label>
          <div className="request-line">
            <select aria-label="HTTP method" value={method} onChange={(event) => setMethod(event.target.value)}>
              {methods.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input
              id="request-path"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="/projects"
              required
            />
            <button type="submit" disabled={loading}>{loading ? "Sending…" : "Send"}</button>
          </div>

          {method !== "GET" && method !== "DELETE" && (
            <>
              <label htmlFor="request-body">JSON body (optional)</label>
              <textarea
                id="request-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows="6"
                spellCheck="false"
              />
            </>
          )}
        </form>

        <div className="response-heading">
          <h2>Response</h2>
          {status && <span className={status.startsWith("2") ? "status success" : "status"}>{status}</span>}
        </div>
        <pre className={result ? "response has-result" : "response"}>
          {result || "Your response will appear here."}
        </pre>
      </section>
      <footer>Backend URL is configured with <code>VITE_API_URL</code>.</footer>
    </main>
  );
}
