-- AlterTable
ALTER TABLE "PokemonSet" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'EN';

-- AlterTable
ALTER TABLE "CardPrice" ADD COLUMN "variant" TEXT;
