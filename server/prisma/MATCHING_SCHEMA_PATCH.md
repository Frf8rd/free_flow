# Câmpuri necesare pentru potrivire


La integrarea schemei principale, matching-ul va necesita următoarele câmpuri:

```prisma
enum MatchingStatus {
  PENDING
  RUNNING
  DONE
  FAILED
}

model Project {
  
  matchingStatus MatchingStatus @default(PENDING)
  matchingError  String?
  matchedAt      DateTime?
  extracted      Json?

  @@index([status, matchingStatus])
}

model ProjectSkill {
  // În modelul existent:
  source String @default("USER") // USER sau RULES
}

model FreelancerProfile {
  // În modelul existent:
  matchedAt DateTime?
}
```

