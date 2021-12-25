import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  admin as AdminModel,
  donators as DonatorsModel,
  Prisma,
} from '@prisma/client';
import { AdminRank } from '../common/enums/adminRank.enum';
import { UserPrivilegesDto } from './dto/userPrivileges.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async admin(adminWhereInput: Prisma.adminWhereInput): Promise<AdminModel | null> {
    return this.prisma.admin.findFirst({
      where: adminWhereInput,
    });
  }

  async admins(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.adminWhereUniqueInput;
    where?: Prisma.adminWhereInput;
    orderBy?: Prisma.adminOrderByWithRelationInput;
  }): Promise<AdminModel[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.admin.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async donator(donatorsWhereInput: Prisma.donatorsWhereInput): Promise<DonatorsModel | null> {
    return this.prisma.donators.findFirst({
      where: donatorsWhereInput,
    });
  }

  async getUserPrivilegesByCkey(ckey: string): Promise<UserPrivilegesDto> {
    const admin = await this.admin({
      ckey,
      rank: {
        not: 'Удален',
      },
    })

    const donator = await this.donator({
      ckey, 
      active: true,
      start_date: {
        lte: new Date(),
      },
      end_date: {
        gt: new Date(),
      },
    })
      
    return {
      ckey: ckey,
      adminRank: <keyof typeof AdminRank> admin?.rank,
      adminFlags: admin?.flags,
      donatorTier: donator?.tier,
    };
  }

  private async createAdmin(data: Prisma.adminCreateInput): Promise<AdminModel> {
    return this.prisma.admin.create({
      data,
    });
  }

  private async updateAdmin(params: {
    where: Prisma.adminWhereUniqueInput;
    data: Prisma.adminUpdateInput;
  }): Promise<AdminModel> {
    const { where, data } = params;
    return this.prisma.admin.update({
      data,
      where,
    });
  }

  private async deleteAdmin(where: Prisma.adminWhereUniqueInput): Promise<AdminModel> {
    return this.prisma.admin.delete({
      where,
    });
  }
}
