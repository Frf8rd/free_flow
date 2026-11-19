import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDb, MOCK_SELF_FREELANCER_ID } from "@/mocks";
import { matchesService } from "./matches.service";

const originalCreateObjectURL = URL.createObjectURL;

describe("matchesService freelancer profile", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:profile-avatar"),
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
  });

  it("saves professional details and an avatar to the public freelancer profile", async () => {
    const updated = await matchesService.updateMyProfile({
      name: "Ana Pop",
      headline: "Designer web",
      about: "Construiesc site-uri accesibile pentru afaceri mici.",
      skills: ["React", "Design"],
      hourlyRate: 42,
      availability: "PART_TIME",
      languages: ["Română", "Engleză"],
      location: "Brașov, România",
      experienceYears: 4,
      website: "https://ana.example",
      avatar: new File(["avatar"], "avatar.png", { type: "image/png" }),
    });
    const publicProfile = await matchesService.getFreelancer(MOCK_SELF_FREELANCER_ID);

    expect(updated.avatarUrl).toBe("blob:profile-avatar");
    expect(publicProfile).toMatchObject({
      name: "Ana Pop",
      location: "Brașov, România",
      experienceYears: 4,
      website: "https://ana.example",
      avatarUrl: "blob:profile-avatar",
    });
    expect(
      getDb().freelancers.find((profile) => profile.id === MOCK_SELF_FREELANCER_ID)?.skills,
    ).toEqual(["React", "Design"]);
  });
});
