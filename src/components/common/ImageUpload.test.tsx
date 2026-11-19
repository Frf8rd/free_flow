import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUpload } from "./ImageUpload";
import { ImagePreview } from "./ImagePreview";
import { AvatarUpload } from "./AvatarUpload";
import { I18nProvider, LOCALE_STORAGE_KEY } from "@/i18n";

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function Demo() {
  const [files, setFiles] = useState<File[]>([]);
  return <ImageUpload files={files} onFilesChange={setFiles} />;
}

describe("ImageUpload", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "ro");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL,
      });
    } else {
      Reflect.deleteProperty(URL, "createObjectURL");
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectURL,
      });
    } else {
      Reflect.deleteProperty(URL, "revokeObjectURL");
    }
  });

  it("previews selected images and lets the user remove them", () => {
    render(
      <I18nProvider>
        <Demo />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByLabelText("Imagini"), {
      target: { files: [new File(["image"], "design.png", { type: "image/png" })] },
    });

    expect(screen.getByRole("img", { name: "design.png" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Elimină imaginea design.png" }));
    expect(screen.queryByRole("img", { name: "design.png" })).toBeNull();
  });

  it("rejects non-image files", () => {
    render(
      <I18nProvider>
        <Demo />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByLabelText("Imagini"), {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });

    expect(screen.getByRole("alert").textContent).toBe("Alege imagini JPG, PNG sau WebP.");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("opens a larger image preview when the uploaded image is clicked", () => {
    render(
      <I18nProvider>
        <ImagePreview src="blob:preview" alt="Design demo" />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mărește imaginea: Design demo" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("img", { name: "Design demo" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("previews a valid profile avatar", () => {
    function DemoAvatar() {
      const [file, setFile] = useState<File | null>(null);
      const [removeAvatar, setRemoveAvatar] = useState(false);
      return (
        <AvatarUpload
          name="Ana Pop"
          file={file}
          removeAvatar={removeAvatar}
          onFileChange={(nextFile) => {
            setFile(nextFile);
            setRemoveAvatar(false);
          }}
          onRemove={() => {
            setFile(null);
            setRemoveAvatar(true);
          }}
        />
      );
    }

    render(
      <I18nProvider>
        <DemoAvatar />
      </I18nProvider>,
    );

    fireEvent.change(screen.getByLabelText("Alege fotografia de profil"), {
      target: { files: [new File(["image"], "avatar.png", { type: "image/png" })] },
    });

    expect(
      screen.getByRole("button", {
        name: "Mărește imaginea: Ana Pop · Fotografie de profil",
      }),
    ).toBeTruthy();
  });
});
