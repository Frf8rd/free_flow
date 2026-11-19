import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDb, mockUsers } from "@/mocks";
import { matchesService } from "./matches.service";
import { engagementsService } from "./workspace.service";
import { useAuthStore } from "@/store/auth";

describe("engagementsService.review", () => {
  beforeEach(() => {
    const db = getDb();
    const engagement = db.engagements.find((item) => item.id === "e-2");
    const freelancer = db.freelancers.find((item) => item.id === "f-1");
    if (!engagement || !freelancer) throw new Error("Review test data is missing.");
    engagement.review = null;
    db.reviews[freelancer.id] = [];
    freelancer.rating = null;
    freelancer.reviewsCount = 0;
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it("adds a completed collaboration review to the freelancer's public profile", async () => {
    useAuthStore.setState({ user: mockUsers.CLIENT, token: "mock-CLIENT" });

    await engagementsService.review("e-2", {
      rating: 4,
      comment: "Great communication and a polished result.",
    });

    const profile = await matchesService.getFreelancer("f-1");
    const reviews = await matchesService.getReviews("f-1");
    expect(profile).toMatchObject({ rating: 4, reviewsCount: 1 });
    expect(reviews[0]).toMatchObject({
      authorName: mockUsers.CLIENT.name,
      rating: 4,
      comment: "Great communication and a polished result.",
    });
  });

  it("does not allow a freelancer to rate a client collaboration", async () => {
    useAuthStore.setState({ user: mockUsers.FREELANCER, token: "mock-FREELANCER" });

    await expect(
      engagementsService.review("e-2", { rating: 5, comment: "A useful review." }),
    ).rejects.toThrow("Doar clientul colaborării poate lăsa o recenzie.");
  });
});
