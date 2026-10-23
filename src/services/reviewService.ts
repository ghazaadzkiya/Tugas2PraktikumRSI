import { AppError } from '../errors/AppError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { ReviewResponseDto } from '../dtos/reviewDto.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository = new ReviewRepository(),
    private readonly stallRepository: StallRepository = new StallRepository(),
  ) {}

  async create(stallId: number, userId: number, input: CreateReviewInput) {
    if (!(await this.stallRepository.findById(stallId))) throw new NotFoundError('Warung tidak ditemukan');
    if (await this.reviewRepository.findByStallAndUser(stallId, userId)) {
      throw new AppError(409, 'Kamu sudah pernah memberi review untuk warung ini');
    }
    const row = await this.reviewRepository.create({
      stallId, userId, rating: input.rating, comment: input.comment ?? null,
    });
    if (!row) throw new AppError(500, 'Review gagal disimpan');
    await this.reviewRepository.refreshStallSummary(stallId);
    const data: ReviewResponseDto = {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt?.toISOString() ?? null,
    };
    return data;
  }
}