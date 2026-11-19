import type { OnboardingInput, User } from "@/types";
import { mockDelay } from "@/mocks";
import { api } from "./api";
import { USE_MOCKS } from "./config";

export const onboardingService = {
  async complete(user: User, input: OnboardingInput): Promise<User> {
    if (USE_MOCKS) {
      await mockDelay(700);
      return { ...user, profileComplete: true };
    }
    const { data } = await api.post<User>("/me/onboarding", input);
    return data;
  },
};
