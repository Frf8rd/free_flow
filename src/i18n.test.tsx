import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { I18nProvider, LOCALE_STORAGE_KEY, translatePhrase, useI18n } from "./i18n";

describe("translatePhrase", () => {
  it("translates full UI messages and dynamic text", () => {
    expect(translatePhrase("Bună, Ada", "en")).toBe("Hello, Ada");
    expect(translatePhrase("Nicio potrivire încă", "ru")).toBe("Совпадений пока нет");
  });

  it("translates known phrases within mixed text without changing unrelated words", () => {
    expect(translatePhrase("Pagina 2 din 5", "en")).toBe("Page 2 of 5");
    expect(translatePhrase("Dinu — Proiecte", "en")).toBe("Dinu — Projects");
  });

  it("keeps Romanian text unchanged for the Romanian locale", () => {
    expect(translatePhrase("Setări", "ro")).toBe("Setări");
  });

  it("translates existing and dynamically updated page text when the locale changes", async () => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    function DemoPage() {
      const { setLocale } = useI18n();
      const [showExtra, setShowExtra] = useState(false);
      return (
        <>
          <button onClick={() => setLocale("en")}>English</button>
          <button onClick={() => setLocale("ru")}>Russian</button>
          <button onClick={() => setLocale("ro")}>Romanian</button>
          <button onClick={() => setShowExtra(true)}>Add content</button>
          <p aria-label="Nicio potrivire încă">Nicio potrivire încă</p>
          {showExtra && <p>Proiecte active</p>}
          <input placeholder="Caută" />
        </>
      );
    }

    render(
      <I18nProvider>
        <DemoPage />
      </I18nProvider>,
    );

    expect(screen.getByText("Nicio potrivire încă")).toBeTruthy();
    fireEvent.click(screen.getByText("English"));
    await waitFor(() => expect(screen.getByText("No matches yet")).toBeTruthy());
    expect(screen.getByPlaceholderText("Search")).toBeTruthy();
    fireEvent.click(screen.getByText("Add content"));
    await waitFor(() => expect(screen.getByText("Active projects")).toBeTruthy());
    fireEvent.click(screen.getByText("Russian"));
    await waitFor(() => expect(screen.getByText("Совпадений пока нет")).toBeTruthy());
    expect(screen.getByPlaceholderText("Поиск")).toBeTruthy();
    expect(screen.getByLabelText("Совпадений пока нет")).toBeTruthy();
    expect(screen.getByText("Активные проекты")).toBeTruthy();
    fireEvent.click(screen.getByText("Румынский"));
    await waitFor(() => expect(screen.getByText("Nicio potrivire încă")).toBeTruthy());
    expect(screen.getByPlaceholderText("Caută")).toBeTruthy();
  });
});
