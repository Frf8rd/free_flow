const prisma = require("../config/prisma");
const { AppError } = require("../utils/errors");
const { parsePagination } = require("../utils/pagination");
const { reviewCreateSchema, reviewUpdateSchema, parse, parseId } = require("../validators/reviews.validator");

const reviewSelect = {
  id: true,
  engagementId: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, avatarUrl: true } },
  engagement: { select: { project: { select: { id: true, title: true } } } },
};

function toReview({ engagement, ...review }) {
  return { ...review, project: engagement ? engagement.project : null };
}

function reviewExists() {
  return new AppError(409, "REVIEW_EXISTS", "Ai lăsat deja o recenzie pentru această colaborare.");
}

// Recenzie după încheierea colaborării (COMPLETED), o singură dată per participant.
async function createReview(user, engagementId, input, db = prisma) {
  const id = parseId(engagementId);
  const data = parse(reviewCreateSchema, input);

  const engagement = await db.engagement.findUnique({
    where: { id },
    select: { id: true, clientId: true, freelancerId: true, status: true },
  });
  // Cine nu participă la colaborare primește 404, ca să nu afle că ea există.
  if (!engagement || (engagement.clientId !== user.id && engagement.freelancerId !== user.id)) {
    throw new AppError(404, "ENGAGEMENT_NOT_FOUND", "Colaborarea nu a fost găsită.");
  }
  if (engagement.status !== "COMPLETED") {
    throw new AppError(409, "ENGAGEMENT_NOT_COMPLETED", "Poți lăsa o recenzie doar după finalizarea colaborării.");
  }

  const targetId = engagement.clientId === user.id ? engagement.freelancerId : engagement.clientId;
  const existing = await db.review.findUnique({
    where: { engagementId_authorId: { engagementId: id, authorId: user.id } },
    select: { id: true },
  });
  if (existing) throw reviewExists();

  try {
    const review = await db.review.create({
      data: { engagementId: id, authorId: user.id, targetId, ...data },
      select: reviewSelect,
    });
    return toReview(review);
  } catch (error) {
    if (error && error.code === "P2002") throw reviewExists();
    throw error;
  }
}

// Doar autorul își poate modifica/șterge recenzia; ceilalți primesc 404.
async function findOwnReview(user, reviewId, db) {
  const review = await db.review.findFirst({
    where: { id: parseId(reviewId), authorId: user.id },
    select: { id: true },
  });
  if (!review) throw new AppError(404, "REVIEW_NOT_FOUND", "Recenzia nu a fost găsită.");
  return review;
}

async function updateReview(user, reviewId, input, db = prisma) {
  const data = parse(reviewUpdateSchema, input);
  const review = await findOwnReview(user, reviewId, db);
  return toReview(await db.review.update({ where: { id: review.id }, data, select: reviewSelect }));
}

async function deleteReview(user, reviewId, db = prisma) {
  const review = await findOwnReview(user, reviewId, db);
  await db.review.delete({ where: { id: review.id } });
}

async function listFreelancerReviews(freelancerId, query = {}, db = prisma) {
  const id = parseId(freelancerId);
  const { page, limit } = parsePagination(query);

  const freelancer = await db.user.findFirst({
    where: { id, role: "FREELANCER", isBlocked: false },
    select: { id: true },
  });
  if (!freelancer) throw new AppError(404, "NOT_FOUND", "Freelancerul nu a fost găsit.");

  const where = { targetId: id };
  const [total, rows, aggregate] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      select: reviewSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  const average = aggregate._avg.rating;
  return {
    data: rows.map(toReview),
    page,
    limit,
    total,
    averageRating: average === null ? null : Math.round(average * 100) / 100,
  };
}

module.exports = { createReview, updateReview, deleteReview, listFreelancerReviews };