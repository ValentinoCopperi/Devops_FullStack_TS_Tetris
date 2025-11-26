import { PrismaService } from 'src/prisma.service';


export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const prismaService: PrismaService = this.prisma || this.prismaService;

      if (!prismaService) {
        throw new Error(
          'PrismaService not found. Ensure the class has a "prisma" or "prismaService" property.',
        );
      }

      return prismaService.$transaction(async (tx) => {
        // Temporarily replace prisma with transaction client
        const originalPrisma = this.prisma || this.prismaService;
        this.prisma = tx;
        this.prismaService = tx;

        try {
          const result = await originalMethod.apply(this, args);
          return result;
        } finally {
          this.prisma = originalPrisma;
          this.prismaService = originalPrisma;
        }
      });
    };

    return descriptor;
  };
}

