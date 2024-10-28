import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getProducts() {
  return prisma.product.findMany();
}

export async function updateProductStock(productId: number, quantity: number) {
  return prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });
}

export default prisma;